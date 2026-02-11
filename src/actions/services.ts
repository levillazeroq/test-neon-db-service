"use server";

import { revalidatePath } from "next/cache";
import { getDbForOrg } from "@/src/db";
import { services, resources } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createServiceSchema,
  createResourceSchema,
  type CreateServiceInput,
  type CreateResourceInput,
} from "@/src/lib/validators";
import type { ActionResult, Service, Resource } from "@/src/types";

/** Fetch all services for an organization */
export const getServices = async (orgSlug: string): Promise<Service[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  return db.query.services.findMany({
    where: eq(services.organizationId, orgId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
};

/** Fetch a single service by ID */
export const getServiceById = async (
  orgSlug: string,
  serviceId: string,
): Promise<Service | undefined> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  return db.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.organizationId, orgId)),
  });
};

/** Fetch all active services for an organization (for dropdowns) */
export const getActiveServices = async (orgSlug: string): Promise<Service[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  return db.query.services.findMany({
    where: and(eq(services.organizationId, orgId), eq(services.isActive, true)),
    orderBy: (s, { asc }) => [asc(s.name)],
  });
};

/** Create a new service */
export const createService = async (
  orgSlug: string,
  input: CreateServiceInput,
): Promise<ActionResult<Service>> => {
  const parsed = createServiceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  const [service] = await db
    .insert(services)
    .values({
      organizationId: orgId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      durationMinutes: parsed.data.durationMinutes,
      price: parsed.data.price ?? null,
    })
    .returning();

  revalidatePath(`/${orgSlug}/services`);
  revalidatePath(`/${orgSlug}`);

  return { success: true, data: service };
};

/** Delete a service */
export const deleteService = async (
  orgSlug: string,
  serviceId: string,
): Promise<ActionResult> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const [deleted] = await db
    .delete(services)
    .where(and(eq(services.id, serviceId), eq(services.organizationId, orgId)))
    .returning();

  if (!deleted) {
    return { success: false, error: "Servicio no encontrado" };
  }

  revalidatePath(`/${orgSlug}/services`);
  revalidatePath(`/${orgSlug}`);

  return { success: true };
};

// --- Resources ---

/** Fetch all resources for an organization */
export const getResources = async (orgSlug: string): Promise<Resource[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  return db.query.resources.findMany({
    where: eq(resources.organizationId, orgId),
    orderBy: (r, { asc }) => [asc(r.name)],
  });
};

/** Fetch resources for a specific service */
export const getResourcesByService = async (
  orgSlug: string,
  serviceId: string,
): Promise<Resource[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  return db.query.resources.findMany({
    where: and(
      eq(resources.organizationId, orgId),
      eq(resources.serviceId, serviceId),
      eq(resources.isActive, true),
    ),
    orderBy: (r, { asc }) => [asc(r.name)],
  });
};

/** Create a new resource */
export const createResource = async (
  orgSlug: string,
  input: CreateResourceInput,
): Promise<ActionResult<Resource>> => {
  const parsed = createResourceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  const [resource] = await db
    .insert(resources)
    .values({
      organizationId: orgId,
      serviceId: parsed.data.serviceId,
      name: parsed.data.name,
    })
    .returning();

  revalidatePath(`/${orgSlug}/services`);

  return { success: true, data: resource };
};

/** Delete a resource */
export const deleteResource = async (
  orgSlug: string,
  resourceId: string,
): Promise<ActionResult> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const [deleted] = await db
    .delete(resources)
    .where(
      and(eq(resources.id, resourceId), eq(resources.organizationId, orgId)),
    )
    .returning();

  if (!deleted) {
    return { success: false, error: "Recurso no encontrado" };
  }

  revalidatePath(`/${orgSlug}/services`);

  return { success: true };
};
