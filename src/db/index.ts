import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Shared database connection.
 * Used for all low-ticket organizations and platform-level tables.
 */
const sharedSql = neon(process.env.DATABASE_URL!);
export const sharedDb = drizzle({ client: sharedSql, schema });

/**
 * Creates a Drizzle client for a dedicated tenant database.
 * Used for high-ticket organizations with their own Neon project.
 */
export const getTenantDb = (databaseUrl: string) => {
  const tenantSql = neon(databaseUrl);
  return drizzle({ client: tenantSql, schema });
};

/** Type of the DB client with schema */
type DbClient = typeof sharedDb;

/** Result of resolving which DB to use for an organization */
interface OrgDbResult {
  db: DbClient;
  orgId: string;
  isDedicated: boolean;
}

/**
 * Smart resolver: returns the correct DB instance based on the organization's tier.
 * - "shared" tier -> uses the shared DB, queries filter by organization_id
 * - "dedicated" tier -> uses a separate Neon project DB
 */
export const getDbForOrg = async (orgSlug: string): Promise<OrgDbResult> => {
  const org = await sharedDb.query.organizations.findFirst({
    where: eq(schema.organizations.slug, orgSlug),
  });

  if (!org) {
    throw new Error(`Organization not found: ${orgSlug}`);
  }

  if (org.tier === "dedicated" && org.databaseUrl) {
    return {
      db: getTenantDb(org.databaseUrl),
      orgId: org.id,
      isDedicated: true,
    };
  }

  return {
    db: sharedDb,
    orgId: org.id,
    isDedicated: false,
  };
};
