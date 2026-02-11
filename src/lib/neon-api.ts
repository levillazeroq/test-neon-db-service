import { createApiClient } from "@neondatabase/api-client";

/**
 * Creates an authenticated Neon API client.
 * Requires NEON_API_KEY environment variable.
 */
export const getNeonApiClient = () => {
  const apiKey = process.env.NEON_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NEON_API_KEY environment variable is not set. " +
        "Get your API key from https://console.neon.tech/app/settings/api-keys",
    );
  }

  return createApiClient({ apiKey });
};

/** Default region for new projects */
export const DEFAULT_NEON_REGION = "aws-us-east-2";

/** Default Postgres version */
export const DEFAULT_PG_VERSION = 17;

/**
 * Returns the Neon organization ID if configured.
 * Required when the API key belongs to an organization.
 */
export const getNeonOrgId = (): string | undefined => {
  return process.env.NEON_ORG_ID;
};

/** Result of provisioning a dedicated database */
export interface ProvisionedDatabase {
  projectId: string;
  projectName: string;
  connectionUri: string;
  branchId: string;
  databaseName: string;
  roleName: string;
  region: string;
}
