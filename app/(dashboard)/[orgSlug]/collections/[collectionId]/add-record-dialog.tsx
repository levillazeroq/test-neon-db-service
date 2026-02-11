"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRecord } from "@/src/actions/collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { CustomField } from "@/src/types";

interface AddRecordDialogProps {
  orgSlug: string;
  collectionId: string;
  fields: CustomField[];
}

export const AddRecordDialog = ({
  orgSlug,
  collectionId,
  fields,
}: AddRecordDialogProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleReset = () => {
    setFormData({});
    setError(null);
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) handleReset();
  };

  const handleFieldValue = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    // Validate required fields
    for (const field of fields) {
      if (field.isRequired) {
        const val = formData[field.id];
        if (val === undefined || val === null || val === "") {
          setError(`El campo "${field.name}" es requerido`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    const result = await createRecord(orgSlug, collectionId, {
      data: formData,
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear registro");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    router.refresh();
    setIsSubmitting(false);
  };

  const renderFieldInput = (field: CustomField) => {
    const value = formData[field.id] ?? "";

    switch (field.fieldType) {
      case "boolean":
        return (
          <Select
            value={String(value || "")}
            onValueChange={(v) =>
              handleFieldValue(field.id, v === "true")
            }
          >
            <SelectTrigger aria-label={field.name}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Si</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <Input
            type="number"
            value={String(value)}
            onChange={(e) =>
              handleFieldValue(
                field.id,
                e.target.value ? Number(e.target.value) : "",
              )
            }
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            aria-label={field.name}
            tabIndex={0}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={String(value)}
            onChange={(e) => handleFieldValue(field.id, e.target.value)}
            aria-label={field.name}
            tabIndex={0}
          />
        );
      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={String(value)}
            onChange={(e) => handleFieldValue(field.id, e.target.value)}
            aria-label={field.name}
            tabIndex={0}
          />
        );
      case "email":
        return (
          <Input
            type="email"
            value={String(value)}
            onChange={(e) => handleFieldValue(field.id, e.target.value)}
            placeholder="email@ejemplo.com"
            aria-label={field.name}
            tabIndex={0}
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            value={String(value)}
            onChange={(e) => handleFieldValue(field.id, e.target.value)}
            placeholder="+52 55 1234 5678"
            aria-label={field.name}
            tabIndex={0}
          />
        );
      case "url":
        return (
          <Input
            type="url"
            value={String(value)}
            onChange={(e) => handleFieldValue(field.id, e.target.value)}
            placeholder="https://..."
            aria-label={field.name}
            tabIndex={0}
          />
        );
      case "select": {
        const opts = (field.options as { values?: string[] })?.values ?? [];
        if (opts.length > 0) {
          return (
            <Select
              value={String(value || "")}
              onValueChange={(v) => handleFieldValue(field.id, v)}
            >
              <SelectTrigger aria-label={field.name}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {opts.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return (
          <Input
            value={String(value)}
            onChange={(e) => handleFieldValue(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            aria-label={field.name}
            tabIndex={0}
          />
        );
      }
      default:
        return (
          <Input
            value={String(value)}
            onChange={(e) => handleFieldValue(field.id, e.target.value)}
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            aria-label={field.name}
            tabIndex={0}
          />
        );
    }
  };

  if (fields.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button tabIndex={0} aria-label="Agregar registro">
          <Plus className="mr-2 h-4 w-4" />
          Agregar registro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo registro</DialogTitle>
          <DialogDescription>
            Completa los campos para agregar un nuevo registro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label>
                {field.name}
                {field.isRequired && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </Label>
              {renderFieldInput(field)}
            </div>
          ))}
        </div>

        {error && (
          <div
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            tabIndex={0}
            aria-label="Cancelar"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            tabIndex={0}
            aria-label="Guardar registro"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
