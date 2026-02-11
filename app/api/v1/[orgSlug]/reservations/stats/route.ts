import { NextRequest, NextResponse } from "next/server";
import { getReservationCounts } from "@/src/actions/reservations";

type RouteParams = { params: Promise<{ orgSlug: string }> };

/** GET /api/v1/[orgSlug]/reservations/stats — Get reservation counts by status */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params;
    const data = await getReservationCounts(orgSlug);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
