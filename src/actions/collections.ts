"use server";

import { revalidatePath } from "next/cache";
import { getDbForOrg } from "@/src/db";
import {
  customCollections,
  customFields,
  customRecords,
} from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  createCollectionSchema,
  createFieldSchema,
  createRecordSchema,
  type CreateCollectionInput,
  type CreateFieldInput,
  type CreateRecordInput,
} from "@/src/lib/validators";
import type {
  ActionResult,
  CustomCollection,
  CustomField,
  CustomRecord,
} from "@/src/types";

// ============================
// Collections
// ============================

/** Fetch all collections for an organization */
export const getCollections = async (
  orgSlug: string,
): Promise<CustomCollection[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);
  return db.query.customCollections.findMany({
    where: eq(customCollections.organizationId, orgId),
    orderBy: (cols, { desc }) => [desc(cols.createdAt)],
  });
};

/** Fetch a single collection with its fields */
export const getCollectionWithFields = async (
  orgSlug: string,
  collectionId: string,
): Promise<{ collection: CustomCollection; fields: CustomField[] } | null> => {
  const { db, orgId } = await getDbForOrg(orgSlug);
  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });

  if (!collection || collection.organizationId !== orgId) {
    return null;
  }

  const fields = await db.query.customFields.findMany({
    where: eq(customFields.collectionId, collectionId),
    orderBy: [asc(customFields.fieldOrder)],
  });

  return { collection, fields };
};

/** Create a collection with initial fields */
export const createCollection = async (
  orgSlug: string,
  input: CreateCollectionInput,
  fieldInputs: CreateFieldInput[],
): Promise<ActionResult<CustomCollection>> => {
  const parsed = createCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  const [collection] = await db
    .insert(customCollections)
    .values({
      organizationId: orgId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
    })
    .returning();

  // Insert fields if provided
  if (fieldInputs.length > 0) {
    const validFields = fieldInputs.map((f, idx) => {
      const pf = createFieldSchema.safeParse(f);
      if (!pf.success) return null;
      return {
        collectionId: collection.id,
        name: pf.data.name,
        fieldType: pf.data.fieldType,
        fieldOrder: idx,
        isRequired: pf.data.isRequired,
        options: pf.data.options ?? {},
      };
    }).filter(Boolean) as {
      collectionId: string;
      name: string;
      fieldType: typeof fieldInputs[number]["fieldType"];
      fieldOrder: number;
      isRequired: boolean;
      options: Record<string, unknown>;
    }[];

    if (validFields.length > 0) {
      await db.insert(customFields).values(validFields);
    }
  }

  revalidatePath(`/${orgSlug}/collections`);

  return { success: true, data: collection };
};

/** Delete a collection */
export const deleteCollection = async (
  orgSlug: string,
  collectionId: string,
): Promise<ActionResult> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });

  if (!collection || collection.organizationId !== orgId) {
    return { success: false, error: "Coleccion no encontrada" };
  }

  await db.delete(customCollections).where(eq(customCollections.id, collectionId));

  revalidatePath(`/${orgSlug}/collections`);

  return { success: true };
};

// ============================
// Fields
// ============================

/** Add a field to a collection */
export const addField = async (
  orgSlug: string,
  collectionId: string,
  input: CreateFieldInput,
): Promise<ActionResult<CustomField>> => {
  const parsed = createFieldSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  // Verify collection belongs to org
  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });
  if (!collection || collection.organizationId !== orgId) {
    return { success: false, error: "Coleccion no encontrada" };
  }

  // Get next order
  const existingFields = await db.query.customFields.findMany({
    where: eq(customFields.collectionId, collectionId),
  });

  const [field] = await db
    .insert(customFields)
    .values({
      collectionId,
      name: parsed.data.name,
      fieldType: parsed.data.fieldType,
      fieldOrder: existingFields.length,
      isRequired: parsed.data.isRequired,
      options: parsed.data.options ?? {},
    })
    .returning();

  revalidatePath(`/${orgSlug}/collections/${collectionId}`);

  return { success: true, data: field };
};

/** Delete a field */
export const deleteField = async (
  orgSlug: string,
  collectionId: string,
  fieldId: string,
): Promise<ActionResult> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });
  if (!collection || collection.organizationId !== orgId) {
    return { success: false, error: "Coleccion no encontrada" };
  }

  await db.delete(customFields).where(eq(customFields.id, fieldId));

  revalidatePath(`/${orgSlug}/collections/${collectionId}`);

  return { success: true };
};

// ============================
// Records
// ============================

/** Fetch all records for a collection */
export const getRecords = async (
  orgSlug: string,
  collectionId: string,
): Promise<CustomRecord[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });
  if (!collection || collection.organizationId !== orgId) {
    return [];
  }

  return db.query.customRecords.findMany({
    where: eq(customRecords.collectionId, collectionId),
    orderBy: (recs, { desc }) => [desc(recs.createdAt)],
  });
};

/** Create a single record */
export const createRecord = async (
  orgSlug: string,
  collectionId: string,
  input: CreateRecordInput,
): Promise<ActionResult<CustomRecord>> => {
  const parsed = createRecordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });
  if (!collection || collection.organizationId !== orgId) {
    return { success: false, error: "Coleccion no encontrada" };
  }

  const [record] = await db
    .insert(customRecords)
    .values({
      collectionId,
      data: parsed.data.data,
    })
    .returning();

  revalidatePath(`/${orgSlug}/collections/${collectionId}`);

  return { success: true, data: record };
};

/** Bulk import records (from CSV/Excel) */
export const bulkImportRecords = async (
  orgSlug: string,
  collectionId: string,
  records: Record<string, unknown>[],
): Promise<ActionResult<{ imported: number }>> => {
  if (records.length === 0) {
    return { success: false, error: "No hay registros para importar" };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });
  if (!collection || collection.organizationId !== orgId) {
    return { success: false, error: "Coleccion no encontrada" };
  }

  const values = records.map((data) => ({
    collectionId,
    data,
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await db.insert(customRecords).values(batch);
    imported += batch.length;
  }

  revalidatePath(`/${orgSlug}/collections/${collectionId}`);

  return { success: true, data: { imported } };
};

/** Delete a record */
export const deleteRecord = async (
  orgSlug: string,
  collectionId: string,
  recordId: string,
): Promise<ActionResult> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });
  if (!collection || collection.organizationId !== orgId) {
    return { success: false, error: "Coleccion no encontrada" };
  }

  await db.delete(customRecords).where(eq(customRecords.id, recordId));

  revalidatePath(`/${orgSlug}/collections/${collectionId}`);

  return { success: true };
};

/** Update a record's data */
export const updateRecord = async (
  orgSlug: string,
  collectionId: string,
  recordId: string,
  data: Record<string, unknown>,
): Promise<ActionResult<CustomRecord>> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const collection = await db.query.customCollections.findFirst({
    where: eq(customCollections.id, collectionId),
  });
  if (!collection || collection.organizationId !== orgId) {
    return { success: false, error: "Coleccion no encontrada" };
  }

  const [updated] = await db
    .update(customRecords)
    .set({ data })
    .where(eq(customRecords.id, recordId))
    .returning();

  if (!updated) {
    return { success: false, error: "Registro no encontrado" };
  }

  revalidatePath(`/${orgSlug}/collections/${collectionId}`);

  return { success: true, data: updated };
};
