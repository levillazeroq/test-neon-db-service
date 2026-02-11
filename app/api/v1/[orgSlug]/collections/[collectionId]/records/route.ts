import { NextRequest, NextResponse } from "next/server";
import { getRecords } from "@/src/actions/collections";
import { getCollectionWithFields } from "@/src/actions/collections";

type RouteParams = {
  params: Promise<{ orgSlug: string; collectionId: string }>;
};

/**
 * GET /api/v1/[orgSlug]/collections/[collectionId]/records
 *
 * Returns records with resolved field names.
 * Query param ?raw=true returns records as-is (field IDs as keys).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, collectionId } = await params;
    const raw = request.nextUrl.searchParams.get("raw") === "true";

    const records = await getRecords(orgSlug, collectionId);

    if (raw) {
      return NextResponse.json({ success: true, data: records });
    }

    // Resolve field names so the AI agent gets human-readable data
    const collectionData = await getCollectionWithFields(orgSlug, collectionId);

    if (!collectionData) {
      return NextResponse.json({ success: true, data: records });
    }

    const fieldMap = new Map(
      collectionData.fields.map((f) => [f.id, { name: f.name, type: f.fieldType }]),
    );

    const resolvedRecords = records.map((record) => {
      const resolvedData: Record<string, unknown> = {};
      const data = record.data as Record<string, unknown> | null;

      if (data) {
        for (const [fieldId, value] of Object.entries(data)) {
          const field = fieldMap.get(fieldId);
          const key = field ? field.name : fieldId;
          resolvedData[key] = value;
        }
      }

      return {
        id: record.id,
        data: resolvedData,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: resolvedRecords,
      collection: collectionData.collection.name,
      fieldCount: collectionData.fields.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
