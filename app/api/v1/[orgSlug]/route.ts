import { NextRequest, NextResponse } from "next/server";
import { getOrganizationBySlug } from "@/src/actions/organizations";

type RouteParams = { params: Promise<{ orgSlug: string }> };

/** GET /api/v1/[orgSlug] — Get organization info */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params;
    const org = await getOrganizationBySlug(orgSlug);

    if (!org) {
      return NextResponse.json(
        { success: false, error: "Organizacion no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
