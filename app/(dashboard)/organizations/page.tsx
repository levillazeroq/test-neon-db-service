import Link from "next/link";
import { getOrganizations } from "@/src/actions/organizations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { DeleteOrganizationButton } from "./delete-button";

export default async function OrganizationsPage() {
  const orgs = await getOrganizations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organizaciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona las organizaciones de tu plataforma
          </p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva organizacion
          </Link>
        </Button>
      </div>

      {orgs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No hay organizaciones
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu primera organizacion para empezar
            </p>
            <Button asChild className="mt-4">
              <Link href="/organizations/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear organizacion
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card key={org.id} className="group relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <CardDescription>/{org.slug}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={org.tier === "dedicated" ? "default" : "secondary"}>
                    {org.tier}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Creada {new Date(org.createdAt).toLocaleDateString("es-MX")}
                  </p>
                  <div className="flex items-center gap-2">
                    <DeleteOrganizationButton
                      orgId={org.id}
                      orgName={org.name}
                    />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${org.slug}`}>
                        Abrir
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
