"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Database,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

/** Reserved routes that are not org slugs */
const RESERVED_ROUTES = new Set(["organizations"]);

/** Extracts the org slug from the pathname if present */
const extractOrgSlug = (pathname: string): string | undefined => {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment || RESERVED_ROUTES.has(firstSegment)) {
    return undefined;
  }

  return firstSegment;
};

interface AppSidebarProps {
  orgSlug?: string;
}

export const AppSidebar = ({ orgSlug: propOrgSlug }: AppSidebarProps) => {
  const pathname = usePathname();
  const orgSlug = useMemo(
    () => propOrgSlug ?? extractOrgSlug(pathname),
    [propOrgSlug, pathname],
  );

  const platformItems = [
    {
      title: "Organizaciones",
      url: "/organizations",
      icon: Building2,
    },
  ];

  const orgItems = orgSlug
    ? [
        {
          title: "Dashboard",
          url: `/${orgSlug}`,
          icon: LayoutDashboard,
        },
        {
          title: "Reservas",
          url: `/${orgSlug}/reservations`,
          icon: CalendarDays,
        },
        {
          title: "Servicios",
          url: `/${orgSlug}/services`,
          icon: Briefcase,
        },
        {
          title: "Clientes",
          url: `/${orgSlug}/customers`,
          icon: Users,
        },
        {
          title: "Colecciones",
          url: `/${orgSlug}/collections`,
          icon: Database,
        },
        {
          title: "Configuracion",
          url: `/${orgSlug}/settings`,
          icon: Settings,
        },
      ]
    : [];

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/organizations" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">ZeroQ</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {orgSlug && orgItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Organizacion</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {orgItems.map((item) => {
                  const isActive =
                    item.url === `/${orgSlug}`
                      ? pathname === item.url
                      : pathname.startsWith(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          ZeroQ AI Agent Platform
        </p>
      </SidebarFooter>
    </Sidebar>
  );
};
