"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Sparkles } from "lucide-react";
import { updateEmbeddingFields, regenerateEmbeddings } from "@/src/actions/collections";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomCollection, CustomField } from "@/src/types";

// Field types that carry meaningful text for embeddings
const TEXT_BASED_TYPES = new Set([
  "text",
  "email",
  "phone",
  "url",
  "select",
  "multi_select",
]);

interface EmbeddingFieldsConfigProps {
  orgSlug: string;
  collection: CustomCollection;
  fields: CustomField[];
  recordCount: number;
}

export const EmbeddingFieldsConfig = ({
  orgSlug,
  collection,
  fields,
  recordCount,
}: EmbeddingFieldsConfigProps) => {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(collection.embeddingFieldIds),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const toggle = (fieldId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateEmbeddingFields(
      orgSlug,
      collection.id,
      Array.from(selected),
    );
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Error al guardar configuracion");
      return;
    }

    toast.success("Configuracion de embeddings guardada");
    router.refresh();
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const result = await regenerateEmbeddings(orgSlug, collection.id);
    setIsRegenerating(false);

    if (!result.success) {
      toast.error(result.error ?? "Error al regenerar embeddings");
      return;
    }

    const count = result.data?.updated ?? 0;
    toast.success(
      `Embeddings generados para ${count} registro${count !== 1 ? "s" : ""}`,
    );
  };

  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Embeddings
        </CardTitle>
        <CardDescription>
          Selecciona los campos que se concatenaran para generar embeddings de
          cada registro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {fields.map((field) => {
            const isSelected = selected.has(field.id);
            const isTextBased = TEXT_BASED_TYPES.has(field.fieldType);
            return (
              <label
                key={field.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(field.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="flex-1 text-sm font-medium">{field.name}</span>
                <span className="text-xs text-muted-foreground">
                  {field.fieldType}
                </span>
                {!isTextBased && (
                  <span className="text-xs text-amber-500">
                    poco util para embeddings
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            {selected.size} campo{selected.size !== 1 ? "s" : ""}{" "}
            seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={
                isRegenerating ||
                isSaving ||
                collection.embeddingFieldIds.length === 0 ||
                recordCount === 0
              }
            >
              <RefreshCw
                className={`mr-2 h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
              />
              {isRegenerating
                ? "Generando..."
                : `Regenerar (${recordCount} registros)`}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isRegenerating} size="sm">
              {isSaving ? "Guardando..." : "Guardar configuracion"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
