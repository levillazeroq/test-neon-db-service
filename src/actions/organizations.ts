"use server";

import { revalidatePath } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { sharedDb } from "@/src/db";
import { organizations } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationTierSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type UpdateOrganizationTierInput,
} from "@/src/lib/validators";
import type { ActionResult, Organization } from "@/src/types";

/** Fetch all organizations */
export const getOrganizations = async (): Promise<Organization[]> => {
  return sharedDb.query.organizations.findMany({
    orderBy: (orgs, { desc }) => [desc(orgs.createdAt)],
  });
};

/** Fetch a single organization by slug */
export const getOrganizationBySlug = async (
  slug: string,
): Promise<Organization | undefined> => {
  return sharedDb.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });
};

/** Create a new organization */
export const createOrganization = async (
  input: CreateOrganizationInput,
): Promise<ActionResult<Organization>> => {
  const parsed = createOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  // Check if slug already exists
  const existing = await sharedDb.query.organizations.findFirst({
    where: eq(organizations.slug, parsed.data.slug),
  });

  if (existing) {
    return { success: false, error: "Ya existe una organizacion con ese slug" };
  }

  const [org] = await sharedDb
    .insert(organizations)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      tier: "shared",
      settings: {},
    })
    .returning();

  revalidatePath("/organizations");

  return { success: true, data: org };
};

/** Update an organization */
export const updateOrganization = async (
  id: string,
  input: UpdateOrganizationInput,
): Promise<ActionResult<Organization>> => {
  const parsed = updateOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const [updated] = await sharedDb
    .update(organizations)
    .set(parsed.data)
    .where(eq(organizations.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Organizacion no encontrada" };
  }

  revalidatePath("/organizations");
  revalidatePath(`/${updated.slug}`);

  return { success: true, data: updated };
};

/** Delete an organization */
export const deleteOrganization = async (
  id: string,
): Promise<ActionResult> => {
  const [deleted] = await sharedDb
    .delete(organizations)
    .where(eq(organizations.id, id))
    .returning();

  if (!deleted) {
    return { success: false, error: "Organizacion no encontrada" };
  }

  revalidatePath("/organizations");

  return { success: true };
};

/** Test a database connection URL */
export const testDatabaseConnection = async (
  databaseUrl: string,
): Promise<ActionResult<{ version: string }>> => {
  if (!databaseUrl) {
    return { success: false, error: "La URL de la base de datos es requerida" };
  }

  try {
    const sql = neon(databaseUrl);
    const result = await sql`SELECT version()`;
    const version = (result[0]?.version as string) ?? "Desconocida";

    return { success: true, data: { version } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      error: `No se pudo conectar: ${message}`,
    };
  }
};

/**
 * Update an organization's database tier.
 * - "shared": uses the shared database (clears databaseUrl)
 * - "dedicated": uses a separate Neon project (requires databaseUrl)
 */
export const updateOrganizationTier = async (
  id: string,
  input: UpdateOrganizationTierInput,
): Promise<ActionResult<Organization>> => {
  const parsed = updateOrganizationTierSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { tier, databaseUrl } = parsed.data;

  // If switching to dedicated, verify the connection first
  if (tier === "dedicated" && databaseUrl) {
    const connectionTest = await testDatabaseConnection(databaseUrl);
    if (!connectionTest.success) {
      return {
        success: false,
        error: `No se puede activar el tier dedicado: ${connectionTest.error}`,
      };
    }
  }

  const [updated] = await sharedDb
    .update(organizations)
    .set({
      tier,
      databaseUrl: tier === "dedicated" ? databaseUrl : null,
    })
    .where(eq(organizations.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Organizacion no encontrada" };
  }

  revalidatePath("/organizations");
  revalidatePath(`/${updated.slug}`);
  revalidatePath(`/${updated.slug}/settings`);

  return { success: true, data: updated };
};
