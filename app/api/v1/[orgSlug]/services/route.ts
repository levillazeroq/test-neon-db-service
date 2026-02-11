import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/src/actions/services";
import { getResources, getResourcesByService } from "@/src/actions/services";

type RouteParams = { params: Promise<{ orgSlug: string }> };

/** GET /api/v1/[orgSlug]/services — List all services (optionally with resources) */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params;
    const includeResources = request.nextUrl.searchParams.get("includeResources") === "true";

    const servicesList = await getServices(orgSlug);

    if (!includeResources) {
      return NextResponse.json({ success: true, data: servicesList });
    }

    const servicesWithResources = await Promise.all(
      servicesList.map(async (service) => {
        const resources = await getResourcesByService(orgSlug, service.id);
        return { ...service, resources };
      }),
    );

    return NextResponse.json({ success: true, data: servicesWithResources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
