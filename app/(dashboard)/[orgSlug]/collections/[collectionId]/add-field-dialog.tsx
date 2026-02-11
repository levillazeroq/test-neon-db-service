"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addField } from "@/src/actions/collections";
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
import { Columns3 } from "lucide-react";
import { customFieldTypeValues } from "@/src/lib/validators";

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  number: "Numero",
  date: "Fecha",
  datetime: "Fecha y hora",
  boolean: "Si/No",
  select: "Seleccion",
  multi_select: "Seleccion multiple",
  email: "Email",
  phone: "Telefono",
  url: "URL",
};

interface AddFieldDialogProps {
  orgSlug: string;
  collectionId: string;
}

export const AddFieldDialog = ({
  orgSlug,
  collectionId,
}: AddFieldDialogProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<string>("text");

  const handleReset = () => {
    setName("");
    setFieldType("text");
    setError(null);
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) handleReset();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("El nombre del campo es requerido");
      return;
    }

    setIsSubmitting(true);

    const result = await addField(orgSlug, collectionId, {
      name: name.trim(),
      fieldType: fieldType as typeof customFieldTypeValues[number],
      isRequired: false,
    });

    if (!result.success) {
      setError(result.error ?? "Error al agregar campo");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    router.refresh();
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" tabIndex={0} aria-label="Agregar campo">
          <Columns3 className="mr-2 h-4 w-4" />
          Agregar campo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo campo</DialogTitle>
          <DialogDescription>
            Agrega una nueva columna a la coleccion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="field-name">Nombre</Label>
            <Input
              id="field-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del campo"
              autoFocus
              aria-label="Nombre del campo"
              tabIndex={0}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger aria-label="Tipo de campo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customFieldTypeValues.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FIELD_TYPE_LABELS[type] ?? type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            disabled={isSubmitting || !name.trim()}
            tabIndex={0}
            aria-label="Agregar campo"
          >
            {isSubmitting ? "Agregando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
