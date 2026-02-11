import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/src/actions/customers";

type RouteParams = { params: Promise<{ orgSlug: string }> };

/** GET /api/v1/[orgSlug]/customers — List all customers */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params;
    const data = await getCustomers(orgSlug);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
