"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  provisionDedicatedDatabase,
  unlinkDedicatedDatabase,
  listNeonProjectsForAssignment,
  assignExistingDatabase,
  type NeonProjectForAssignment,
} from "@/src/actions/neon-projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Server,
  Database,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Rocket,
  Unlink,
  Link2,
} from "lucide-react";
import type { Organization } from "@/src/types";
import type { ProvisionedDatabase } from "@/src/lib/neon-api";

interface ProvisionDatabaseSectionProps {
  org: Organization;
  hasNeonApiKey: boolean;
}

type ProvisionStatus = "idle" | "provisioning" | "success" | "error";

export const ProvisionDatabaseSection = ({
  org,
  hasNeonApiKey,
}: ProvisionDatabaseSectionProps) => {
  const router = useRouter();

  const [status, setStatus] = useState<ProvisionStatus>("idle");
  const [provisionResult, setProvisionResult] =
    useState<ProvisionedDatabase | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showProvisionDialog, setShowProvisionDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [projectsList, setProjectsList] = useState<
    NeonProjectForAssignment[] | null
  >(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [assignLoading, setAssignLoading] = useState(false);

  const isDedicated = org.tier === "dedicated";

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    setProjectsList(null);
    const result = await listNeonProjectsForAssignment();
    if (result.success && result.data) {
      setProjectsList(result.data);
    } else {
      setProjectsError(result.error ?? "Error al cargar proyectos");
    }
    setProjectsLoading(false);
  }, []);

  const handleOpenAssignPicker = () => {
    setShowAssignPicker(true);
    setSelectedProjectId(null);
    if (!projectsList && !projectsLoading) {
      loadProjects();
    }
  };

  const handleAssignExisting = async () => {
    if (!selectedProjectId) return;
    setAssignLoading(true);
    setErrorMessage("");
    const result = await assignExistingDatabase(org.id, selectedProjectId);
    if (result.success) {
      setShowAssignPicker(false);
      setSelectedProjectId(null);
      setProjectsList(null);
      router.refresh();
    } else {
      setErrorMessage(result.error ?? "Error al asignar");
    }
    setAssignLoading(false);
  };

  const availableProjects =
    projectsList?.filter((p) => !p.assignedTo) ?? [];
  const selectedProject = projectsList?.find(
    (p) => p.projectId === selectedProjectId,
  );

  const handleProvision = async () => {
    setShowProvisionDialog(false);
    setStatus("provisioning");
    setErrorMessage("");
    setProvisionResult(null);

    const result = await provisionDedicatedDatabase(org.id);

    if (result.success && result.data) {
      setStatus("success");
      setProvisionResult(result.data);
      router.refresh();
    } else {
      setStatus("error");
      setErrorMessage(result.error ?? "Error desconocido");
    }
  };

  const handleUnlink = async () => {
    setShowUnlinkDialog(false);
    setIsUnlinking(true);

    const result = await unlinkDedicatedDatabase(org.id);

    if (result.success) {
      setStatus("idle");
      setProvisionResult(null);
      router.refresh();
    } else {
      setErrorMessage(result.error ?? "Error al desvincular");
    }

    setIsUnlinking(false);
  };

  // No API key configured
  if (!hasNeonApiKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Neon API Key no configurada
            </p>
            <p className="text-xs text-muted-foreground">
              Para crear bases de datos dedicadas automaticamente, agrega{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                NEON_API_KEY
              </code>{" "}
              a tu archivo{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                .env
              </code>
              . Puedes obtener tu API key en{" "}
              <a
                href="https://console.neon.tech/app/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                console.neon.tech
              </a>
              .
            </p>
            <p className="text-xs text-muted-foreground">
              Alternativamente, usa la seccion de configuracion manual mas
              abajo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Already has a dedicated database
  if (isDedicated && status !== "success") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border bg-green-50 p-4 dark:bg-green-950">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Base de datos dedicada activa
            </p>
            <div className="space-y-1 text-xs text-green-700 dark:text-green-300">
              <p>
                <span className="font-medium">Connection string:</span>{" "}
                <code className="rounded bg-green-100 px-1 py-0.5 font-mono dark:bg-green-900">
                  {maskConnectionString(org.databaseUrl ?? "")}
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnlinkDialog(true)}
            disabled={isUnlinking}
            className="text-destructive hover:text-destructive"
            tabIndex={0}
            aria-label="Desvincular base de datos dedicada"
          >
            {isUnlinking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="mr-2 h-4 w-4" />
            )}
            Desvincular y volver a compartida
          </Button>
        </div>

        {/* Unlink confirmation */}
        <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desvincular base de datos dedicada</AlertDialogTitle>
              <AlertDialogDescription>
                La organizacion volvera a usar la base de datos compartida. El
                proyecto Neon dedicado <strong>no se eliminara</strong>, pero la
                aplicacion dejara de consultarlo. Los datos existentes en la DB
                dedicada se conservan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel tabIndex={0}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlink} tabIndex={0}>
                Desvincular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Idle state - show provision and assign options */}
      {status === "idle" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
            <Server className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Crear base de datos dedicada
              </p>
              <p className="text-xs text-muted-foreground">
                Se creara un nuevo proyecto en Neon con el schema completo de la
                aplicacion. La organizacion pasara a tier dedicado y todas las
                consultas se redirigiran a la nueva base de datos.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Database className="mr-1 h-3 w-3" />
                  PostgreSQL 17
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Region: us-east-2
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Schema automatico
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowProvisionDialog(true)}
              tabIndex={0}
              aria-label="Crear base de datos dedicada para esta organizacion"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Crear base de datos dedicada
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenAssignPicker}
              tabIndex={0}
              aria-label="Asignar una base de datos existente"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Asignar una existente
            </Button>
          </div>

          {/* Assign existing DB picker */}
          {showAssignPicker && (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">
                Selecciona un proyecto Neon existente
              </p>
              <p className="text-xs text-muted-foreground">
                Solo se muestran proyectos que aun no estan asignados a otra
                organizacion.
              </p>
              {projectsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando proyectos...
                </div>
              )}
              {projectsError && (
                <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  {projectsError}
                </div>
              )}
              {!projectsLoading && projectsList && (
                <div className="flex flex-wrap items-end gap-2">
                  <Select
                    value={selectedProjectId ?? ""}
                    onValueChange={(v) =>
                      setSelectedProjectId(v && v !== "__none" ? v : null)
                    }
                    disabled={availableProjects.length === 0}
                  >
                    <SelectTrigger
                      className="min-w-[220px]"
                      aria-label="Proyecto Neon a asignar"
                    >
                      <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No hay proyectos disponibles
                        </SelectItem>
                      ) : (
                        availableProjects.map((p) => (
                          <SelectItem
                            key={p.projectId}
                            value={p.projectId}
                            aria-label={`${p.projectName} (${p.projectId})`}
                          >
                            {p.projectName}
                            {p.region ? ` · ${p.region}` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssignExisting}
                    disabled={
                      !selectedProjectId || assignLoading || !selectedProject
                    }
                    tabIndex={0}
                    aria-label="Asignar proyecto seleccionado"
                  >
                    {assignLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    Asignar a esta organizacion
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAssignPicker(false);
                      setSelectedProjectId(null);
                      setErrorMessage("");
                    }}
                    tabIndex={0}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              {!projectsLoading && projectsList && projectsList.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {availableProjects.length} proyecto(s) disponible(s).
                  {projectsList.some((p) => p.assignedTo) &&
                    ` Otros ya estan asignados a otras organizaciones.`}
                </p>
              )}
              {errorMessage && (
                <p className="text-xs text-destructive">{errorMessage}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Provisioning state */}
      {status === "provisioning" && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">
              Creando base de datos dedicada...
            </p>
            <p className="text-xs text-muted-foreground">
              Esto puede tomar hasta 30 segundos. Se esta creando el proyecto
              Neon y replicando el schema.
            </p>
          </div>
        </div>
      )}

      {/* Success state */}
      {status === "success" && provisionResult && (
        <div className="space-y-3 rounded-lg border bg-green-50 p-4 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Base de datos dedicada creada exitosamente
            </p>
          </div>
          <div className="space-y-1.5 text-xs text-green-700 dark:text-green-300">
            <p>
              <span className="font-medium">Proyecto:</span>{" "}
              {provisionResult.projectName}
            </p>
            <p>
              <span className="font-medium">ID:</span>{" "}
              <code className="rounded bg-green-100 px-1 py-0.5 font-mono dark:bg-green-900">
                {provisionResult.projectId}
              </code>
            </p>
            <p>
              <span className="font-medium">Region:</span>{" "}
              {provisionResult.region}
            </p>
            <p>
              <span className="font-medium">Base de datos:</span>{" "}
              {provisionResult.databaseName}
            </p>
            <p>
              <span className="font-medium">Connection string:</span>{" "}
              <code className="rounded bg-green-100 px-1 py-0.5 font-mono dark:bg-green-900">
                {maskConnectionString(provisionResult.connectionUri)}
              </code>
            </p>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            La connection string ya fue guardada y la organizacion esta usando la
            base de datos dedicada.
          </p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border bg-destructive/10 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Error al crear la base de datos
              </p>
              <p className="break-all text-xs text-destructive/80">
                {errorMessage}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setStatus("idle")}
              tabIndex={0}
              aria-label="Intentar de nuevo"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )}

      {/* Provision confirmation dialog */}
      <AlertDialog
        open={showProvisionDialog}
        onOpenChange={setShowProvisionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Crear base de datos dedicada</AlertDialogTitle>
            <AlertDialogDescription>
              Se creara un nuevo proyecto Neon exclusivo para{" "}
              <strong>{org.name}</strong>. Esto incluye:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
            <li>Un proyecto Neon nuevo (PostgreSQL 17, region us-east-2)</li>
            <li>El schema completo de la aplicacion replicado automaticamente</li>
            <li>La connection string guardada en la organizacion</li>
            <li>Cambio de tier a dedicado</li>
          </ul>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Los datos existentes en la base compartida no se migraran
            automaticamente.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel tabIndex={0}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleProvision} tabIndex={0}>
              <Rocket className="mr-2 h-4 w-4" />
              Crear ahora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Masks the password portion of a connection string for display */
const maskConnectionString = (uri: string): string => {
  if (!uri) return "";
  try {
    return uri.replace(/:([^@]+)@/, ":****@");
  } catch {
    return "****";
  }
};
