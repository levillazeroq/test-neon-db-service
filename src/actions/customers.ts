"use server";

import { revalidatePath } from "next/cache";
import { getDbForOrg } from "@/src/db";
import { customers } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createCustomerSchema,
  type CreateCustomerInput,
} from "@/src/lib/validators";
import type { ActionResult, Customer } from "@/src/types";

/** Fetch all customers for an organization */
export const getCustomers = async (orgSlug: string): Promise<Customer[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  return db.query.customers.findMany({
    where: eq(customers.organizationId, orgId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
};

/** Fetch a single customer by ID */
export const getCustomerById = async (
  orgSlug: string,
  customerId: string,
): Promise<Customer | undefined> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  return db.query.customers.findFirst({
    where: and(
      eq(customers.id, customerId),
      eq(customers.organizationId, orgId),
    ),
  });
};

/** Create a new customer */
export const createCustomer = async (
  orgSlug: string,
  input: CreateCustomerInput,
): Promise<ActionResult<Customer>> => {
  const parsed = createCustomerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  // Check for duplicate email within the org
  if (parsed.data.email) {
    const existing = await db.query.customers.findFirst({
      where: and(
        eq(customers.organizationId, orgId),
        eq(customers.email, parsed.data.email),
      ),
    });

    if (existing) {
      return {
        success: false,
        error: "Ya existe un cliente con ese email en esta organizacion",
      };
    }
  }

  const [customer] = await db
    .insert(customers)
    .values({
      organizationId: orgId,
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
    })
    .returning();

  revalidatePath(`/${orgSlug}/customers`);
  revalidatePath(`/${orgSlug}`);

  return { success: true, data: customer };
};

/** Delete a customer */
export const deleteCustomer = async (
  orgSlug: string,
  customerId: string,
): Promise<ActionResult> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const [deleted] = await db
    .delete(customers)
    .where(
      and(eq(customers.id, customerId), eq(customers.organizationId, orgId)),
    )
    .returning();

  if (!deleted) {
    return { success: false, error: "Cliente no encontrado" };
  }

  revalidatePath(`/${orgSlug}/customers`);
  revalidatePath(`/${orgSlug}`);

  return { success: true };
};
