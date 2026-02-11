import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrganizationBySlug } from "@/src/actions/organizations";
import { getServices, getResources } from "@/src/actions/services";
import { getCustomers } from "@/src/actions/customers";
import { getReservations } from "@/src/actions/reservations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Briefcase,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";

interface OrgDashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgDashboardPage({
  params,
}: OrgDashboardPageProps) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);

  if (!org) {
    notFound();
  }

  const [servicesData, resourcesData, customersData, reservationsData] =
    await Promise.all([
      getServices(orgSlug),
      getResources(orgSlug),
      getCustomers(orgSlug),
      getReservations(orgSlug),
    ]);

  const hasServices = servicesData.length > 0;
  const hasResources = resourcesData.length > 0;
  const hasCustomers = customersData.length > 0;
  const canCreateReservation = hasServices && hasResources && hasCustomers;

  const stats = [
    {
      title: "Reservas",
      value: String(reservationsData.length),
      description: "Total de reservas",
      icon: CalendarDays,
      href: `/${orgSlug}/reservations`,
    },
    {
      title: "Servicios",
      value: String(servicesData.length),
      description: `${servicesData.filter((s) => s.isActive).length} activos`,
      icon: Briefcase,
      href: `/${orgSlug}/services`,
    },
    {
      title: "Clientes",
      value: String(customersData.length),
      description: "Registrados",
      icon: Users,
      href: `/${orgSlug}/customers`,
    },
  ];

  /** Steps the user needs to complete before creating a reservation */
  const setupSteps = [
    {
      label: "Crear un servicio",
      description: "Define que se puede reservar (ej: Corte de pelo, Consulta)",
      done: hasServices,
      href: `/${orgSlug}/services`,
    },
    {
      label: "Agregar un recurso al servicio",
      description: "Quien o que provee el servicio (ej: Maria, Sala 1)",
      done: hasResources,
      href: `/${orgSlug}/services`,
    },
    {
      label: "Registrar un cliente",
      description: "Quien va a hacer la reserva",
      done: hasCustomers,
      href: `/${orgSlug}/customers`,
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
            <Badge
              variant={org.tier === "dedicated" ? "default" : "secondary"}
            >
              {org.tier}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Dashboard de la organizacion /{org.slug}
          </p>
        </div>
        {canCreateReservation && (
          <Button asChild>
            <Link href={`/${orgSlug}/reservations`}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva reserva
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Setup guide - only show when setup is incomplete */}
      {!canCreateReservation && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-amber-600" />
              Configura tu sistema de reservas
            </CardTitle>
            <CardDescription>
              Completa estos {3 - completedSteps} paso
              {3 - completedSteps !== 1 ? "s" : ""} para empezar a crear
              reservas ({completedSteps}/3)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {setupSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className="group flex items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/50"
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {!step.done && (
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick actions when setup IS complete */}
      {canCreateReservation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones rapidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={`/${orgSlug}/reservations`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva reserva
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${orgSlug}/services`}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Servicios
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${orgSlug}/customers`}>
                  <Users className="mr-2 h-4 w-4" />
                  Clientes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Org info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Informacion de la organizacion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">ID</p>
              <p className="font-mono text-xs">{org.id}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Tier</p>
              <p className="capitalize">{org.tier}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Creada</p>
              <p>
                {new Date(org.createdAt).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">
                Base de datos
              </p>
              <p>{org.tier === "dedicated" ? "Dedicada" : "Compartida"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
