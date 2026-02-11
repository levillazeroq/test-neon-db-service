"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrganizationTier,
  testDatabaseConnection,
} from "@/src/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Database,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { Organization, OrganizationTier } from "@/src/types";

interface TierConfigFormProps {
  org: Organization;
}

type ConnectionStatus = "idle" | "testing" | "success" | "error";

export const TierConfigForm = ({ org }: TierConfigFormProps) => {
  const router = useRouter();

  const [tier, setTier] = useState<OrganizationTier>(
    org.tier as OrganizationTier,
  );
  const [databaseUrl, setDatabaseUrl] = useState(org.databaseUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Connection test state
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [connectionMessage, setConnectionMessage] = useState<string>("");

  // Result message
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const currentTier = org.tier as OrganizationTier;
  const hasChanges =
    tier !== currentTier || (tier === "dedicated" && databaseUrl !== (org.databaseUrl ?? ""));

  const handleTestConnection = async () => {
    if (!databaseUrl.trim()) {
      setConnectionStatus("error");
      setConnectionMessage("Ingresa una URL de base de datos");
      return;
    }

    setConnectionStatus("testing");
    setConnectionMessage("");

    const result = await testDatabaseConnection(databaseUrl);

    if (result.success) {
      setConnectionStatus("success");
      setConnectionMessage(`Conexion exitosa — ${result.data?.version}`);
    } else {
      setConnectionStatus("error");
      setConnectionMessage(result.error ?? "Error de conexion");
    }
  };

  const handleTierChange = (value: string) => {
    const newTier = value as OrganizationTier;
    setTier(newTier);
    setMessage(null);

    // Reset connection status when switching tiers
    if (newTier === "shared") {
      setConnectionStatus("idle");
      setConnectionMessage("");
    }
  };

  const handleSave = () => {
    // If switching between tiers, show confirmation
    if (tier !== currentTier) {
      setShowConfirmDialog(true);
      return;
    }

    // If just updating database URL on same tier, save directly
    executeSave();
  };

  const executeSave = async () => {
    setIsSaving(true);
    setMessage(null);
    setShowConfirmDialog(false);

    const result = await updateOrganizationTier(org.id, {
      tier,
      databaseUrl: tier === "dedicated" ? databaseUrl : undefined,
    });

    if (result.success) {
      setMessage({
        type: "success",
        text:
          tier === "dedicated"
            ? "Organizacion configurada con base de datos dedicada"
            : "Organizacion configurada con base de datos compartida",
      });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: result.error ?? "Error al actualizar",
      });
    }

    setIsSaving(false);
  };

  const isSaveDisabled =
    !hasChanges ||
    isSaving ||
    (tier === "dedicated" && !databaseUrl.trim()) ||
    (tier === "dedicated" && connectionStatus !== "success");

  return (
    <div className="space-y-6">
      {/* Tier selector */}
      <div className="space-y-3">
        <Label htmlFor="tier-select">Tipo de base de datos</Label>
        <Select value={tier} onValueChange={handleTierChange}>
          <SelectTrigger
            id="tier-select"
            className="w-full"
            aria-label="Seleccionar tipo de base de datos"
            tabIndex={0}
          >
            <SelectValue placeholder="Selecciona un tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shared">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Compartida (Shared)</span>
              </div>
            </SelectItem>
            <SelectItem value="dedicated">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>Dedicada (Dedicated)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tier description cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-lg border p-4 transition-colors ${
            tier === "shared"
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <h4 className="font-medium">Compartida</h4>
            {tier === "shared" && <Badge variant="default">Activo</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Los datos se almacenan en la base de datos compartida, aislados por
            organization_id. Ideal para clientes estandar.
          </p>
        </div>

        <div
          className={`rounded-lg border p-4 transition-colors ${
            tier === "dedicated"
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <h4 className="font-medium">Dedicada</h4>
            {tier === "dedicated" && <Badge variant="default">Activo</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Proyecto Neon separado con aislamiento completo. Mayor rendimiento y
            seguridad para clientes premium.
          </p>
        </div>
      </div>

      {/* Database URL input - only for dedicated tier */}
      {tier === "dedicated" && (
        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <div className="space-y-2">
            <Label htmlFor="database-url">URL de la base de datos dedicada</Label>
            <div className="flex gap-2">
              <Input
                id="database-url"
                type="password"
                placeholder="postgresql://user:password@host/dbname?sslmode=require"
                value={databaseUrl}
                onChange={(e) => {
                  setDatabaseUrl(e.target.value);
                  setConnectionStatus("idle");
                  setConnectionMessage("");
                }}
                className="font-mono text-sm"
                aria-label="URL de la base de datos dedicada"
                tabIndex={0}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={
                  connectionStatus === "testing" || !databaseUrl.trim()
                }
                tabIndex={0}
                aria-label="Probar conexion a la base de datos"
              >
                {connectionStatus === "testing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Probar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              URL de conexion del proyecto Neon dedicado. Puedes encontrarla en
              el dashboard de Neon.
            </p>
          </div>

          {/* Connection status indicator */}
          {connectionStatus !== "idle" && (
            <div
              className={`flex items-start gap-2 rounded-md p-3 text-sm ${
                connectionStatus === "testing"
                  ? "bg-muted text-muted-foreground"
                  : connectionStatus === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
              }`}
              role="status"
            >
              {connectionStatus === "testing" && (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              )}
              {connectionStatus === "success" && (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {connectionStatus === "error" && (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="break-all">{connectionMessage}</span>
            </div>
          )}

          {tier === "dedicated" && connectionStatus !== "success" && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Debes probar la conexion exitosamente antes de guardar
            </p>
          )}
        </div>
      )}

      {/* Result message */}
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-destructive/10 text-destructive"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          tabIndex={0}
          aria-label="Guardar configuracion de base de datos"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar configuracion"
          )}
        </Button>
      </div>

      {/* Confirmation dialog for tier changes */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tier === "dedicated"
                ? "Cambiar a base de datos dedicada"
                : "Cambiar a base de datos compartida"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tier === "dedicated" ? (
                <>
                  Esta organizacion pasara a usar una base de datos dedicada.
                  Los datos existentes en la base compartida{" "}
                  <strong>no se migraran automaticamente</strong>. Deberas
                  migrar los datos manualmente si es necesario.
                </>
              ) : (
                <>
                  Esta organizacion pasara a usar la base de datos compartida.
                  La conexion a la base dedicada se desvinculara. Los datos en
                  la base dedicada <strong>no se eliminaran</strong>, pero la
                  aplicacion dejara de consultarlos.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel tabIndex={0} aria-label="Cancelar cambio de tier">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSave}
              tabIndex={0}
              aria-label="Confirmar cambio de tier"
            >
              {isSaving ? "Guardando..." : "Confirmar cambio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
