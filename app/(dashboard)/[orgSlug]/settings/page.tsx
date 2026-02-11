import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/src/actions/organizations";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TierConfigForm } from "./tier-config-form";
import { OrgGeneralForm } from "./org-general-form";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Gestiona la configuracion de {org.name}
        </p>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion general</CardTitle>
          <CardDescription>
            Nombre y datos basicos de la organizacion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgGeneralForm org={org} />
        </CardContent>
      </Card>

      <Separator />

      {/* Database Tier Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Base de datos</CardTitle>
              <CardDescription>
                Configura si esta organizacion usa la base de datos compartida o
                una dedicada
              </CardDescription>
            </div>
            <Badge variant={org.tier === "dedicated" ? "default" : "secondary"}>
              {org.tier === "dedicated" ? "Dedicada" : "Compartida"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TierConfigForm org={org} />
        </CardContent>
      </Card>
    </div>
  );
}
