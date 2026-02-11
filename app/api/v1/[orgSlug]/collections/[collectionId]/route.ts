import { NextRequest, NextResponse } from "next/server";
import { getCollectionWithFields } from "@/src/actions/collections";

type RouteParams = {
  params: Promise<{ orgSlug: string; collectionId: string }>;
};

/** GET /api/v1/[orgSlug]/collections/[collectionId] — Get collection with its fields */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, collectionId } = await params;
    const data = await getCollectionWithFields(orgSlug, collectionId);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Coleccion no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
