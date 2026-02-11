"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/src/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organization } from "@/src/types";

interface OrgGeneralFormProps {
  org: Organization;
}

export const OrgGeneralForm = ({ org }: OrgGeneralFormProps) => {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const hasChanges = name !== org.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsSaving(true);
    setMessage(null);

    const result = await updateOrganization(org.id, { name });

    if (result.success) {
      setMessage({ type: "success", text: "Nombre actualizado correctamente" });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: result.error ?? "Error al actualizar",
      });
    }

    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Nombre</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Nombre de la organizacion"
          tabIndex={0}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-slug">Slug (URL)</Label>
        <Input
          id="org-slug"
          value={org.slug}
          disabled
          className="text-muted-foreground"
          aria-label="Slug de la organizacion (no editable)"
        />
        <p className="text-xs text-muted-foreground">
          El slug no se puede cambiar despues de la creacion
        </p>
      </div>

      <div className="space-y-2">
        <Label>ID</Label>
        <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs">
          {org.id}
        </p>
      </div>

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

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!hasChanges || isSaving}
          tabIndex={0}
          aria-label="Guardar nombre"
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
};
