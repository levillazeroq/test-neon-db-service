"use server";

import { revalidatePath } from "next/cache";
import { exec } from "child_process";
import { promisify } from "util";
import { sharedDb } from "@/src/db";
import { organizations } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  getNeonApiClient,
  getNeonOrgId,
  DEFAULT_NEON_REGION,
  DEFAULT_PG_VERSION,
  type ProvisionedDatabase,
} from "@/src/lib/neon-api";
import type { ActionResult, Organization } from "@/src/types";

const execAsync = promisify(exec);

/**
 * Provisions a dedicated Neon project for an organization.
 *
 * Steps:
 * 1. Creates a new Neon project via the API
 * 2. Extracts the connection URI
 * 3. Pushes the Drizzle schema to the new database
 * 4. Saves the connection URI to the organization record
 * 5. Updates the organization tier to "dedicated"
 */
export const provisionDedicatedDatabase = async (
  orgId: string,
): Promise<ActionResult<ProvisionedDatabase>> => {
  // 1. Fetch the organization
  const org = await sharedDb.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) {
    return { success: false, error: "Organizacion no encontrada" };
  }

  if (org.tier === "dedicated" && org.databaseUrl) {
    return {
      success: false,
      error: "Esta organizacion ya tiene una base de datos dedicada",
    };
  }

  try {
    // 2. Create a Neon project
    const neonApi = getNeonApiClient();
    const projectName = `zeroq-${org.slug}`;

    const neonOrgId = getNeonOrgId();

    const createResponse = await neonApi.createProject({
      project: {
        name: projectName,
        pg_version: DEFAULT_PG_VERSION,
        region_id: DEFAULT_NEON_REGION,
        ...(neonOrgId ? { org_id: neonOrgId } : {}),
      },
    });

    const project = createResponse.data;
    const connectionUri = project.connection_uris?.[0]?.connection_uri;
    const projectId = project.project?.id;

    if (!connectionUri || !projectId) {
      return {
        success: false,
        error: "El proyecto Neon fue creado pero no se obtuvo la URI de conexion",
      };
    }

    // Extract metadata from the response
    const branchId =
      project.branch?.id ?? "";
    const databaseName =
      project.databases?.[0]?.name ?? "neondb";
    const roleName =
      project.roles?.[0]?.name ?? "neondb_owner";

    // 3. Push the Drizzle schema to the new database
    const schemaResult = await pushSchemaToDatabase(connectionUri);

    if (!schemaResult.success) {
      // Clean up: delete the project if schema push failed
      try {
        await neonApi.deleteProject(projectId);
      } catch {
        // Ignore cleanup errors
      }
      return {
        success: false,
        error: `Error al crear el schema en la nueva DB: ${schemaResult.error}`,
      };
    }

    // 4. Append pooler suffix for production connection string
    // Neon pooled connections use -pooler in the hostname
    const pooledUri = connectionUri.replace(
      /(@[^/]+)/,
      (match) => {
        if (match.includes("-pooler")) return match;
        return match.replace(/(@[^.]+)/, "$1-pooler");
      },
    );

    // 5. Save the connection URI and update the tier
    const [updated] = await sharedDb
      .update(organizations)
      .set({
        tier: "dedicated" as const,
        databaseUrl: pooledUri,
      })
      .where(eq(organizations.id, orgId))
      .returning();

    if (!updated) {
      return { success: false, error: "Error al actualizar la organizacion" };
    }

    revalidatePath("/organizations");
    revalidatePath(`/${updated.slug}`);
    revalidatePath(`/${updated.slug}/settings`);

    const result: ProvisionedDatabase = {
      projectId,
      projectName,
      connectionUri: pooledUri,
      branchId,
      databaseName,
      roleName,
      region: DEFAULT_NEON_REGION,
    };

    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      error: `Error al crear el proyecto Neon: ${message}`,
    };
  }
};

/**
 * Pushes the Drizzle schema to a target database using drizzle-kit push.
 * This reuses the existing schema definitions from src/db/schema/.
 */
const pushSchemaToDatabase = async (
  databaseUrl: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { stderr } = await execAsync(
      `DATABASE_URL="${databaseUrl}" npx drizzle-kit push --force`,
      {
        cwd: process.cwd(),
        timeout: 30000,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
      },
    );

    // drizzle-kit push outputs to stderr for progress, check for actual errors
    if (stderr && stderr.includes("Error")) {
      return { success: false, error: stderr };
    }

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
};

/**
 * Removes the dedicated database for an organization and reverts to shared tier.
 * NOTE: This does NOT delete the Neon project - only unlinks it.
 */
export const unlinkDedicatedDatabase = async (
  orgId: string,
): Promise<ActionResult<Organization>> => {
  const [updated] = await sharedDb
    .update(organizations)
    .set({
      tier: "shared",
      databaseUrl: null,
    })
    .where(eq(organizations.id, orgId))
    .returning();

  if (!updated) {
    return { success: false, error: "Organizacion no encontrada" };
  }

  revalidatePath("/organizations");
  revalidatePath(`/${updated.slug}`);
  revalidatePath(`/${updated.slug}/settings`);

  return { success: true, data: updated };
};
