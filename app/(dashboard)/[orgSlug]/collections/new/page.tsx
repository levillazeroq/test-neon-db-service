"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createCollection } from "@/src/actions/collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";
import { customFieldTypeValues } from "@/src/lib/validators";
import type { CreateFieldInput } from "@/src/lib/validators";

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

export default function NewCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [fields, setFields] = useState<CreateFieldInput[]>([
    { name: "", fieldType: "text", isRequired: false },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddField = () => {
    setFields([...fields, { name: "", fieldType: "text", isRequired: false }]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (
    index: number,
    key: keyof CreateFieldInput,
    value: string | boolean,
  ) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate fields have names
    const validFields = fields.filter((f) => f.name.trim() !== "");
    if (validFields.length === 0) {
      setError("Agrega al menos un campo con nombre");
      setIsSubmitting(false);
      return;
    }

    const result = await createCollection(
      orgSlug,
      { name, description: description || undefined, icon: icon || undefined },
      validFields,
    );

    if (!result.success) {
      setError(result.error ?? "Error al crear la coleccion");
      setIsSubmitting(false);
      return;
    }

    router.push(`/${orgSlug}/collections/${result.data!.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgSlug}/collections`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva coleccion</CardTitle>
          <CardDescription>
            Define una tabla de datos personalizada con sus campos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Collection info */}
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_80px] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Inventario, Empleados, Proveedores..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    aria-label="Nombre de la coleccion"
                    tabIndex={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icono</Label>
                  <Input
                    id="icon"
                    placeholder="📦"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={4}
                    aria-label="Icono de la coleccion"
                    tabIndex={0}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el proposito de esta coleccion..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  aria-label="Descripcion de la coleccion"
                  tabIndex={0}
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Campos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  tabIndex={0}
                  aria-label="Agregar campo"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar campo
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border p-3"
                  >
                    <Input
                      placeholder="Nombre del campo"
                      value={field.name}
                      onChange={(e) =>
                        handleFieldChange(index, "name", e.target.value)
                      }
                      className="flex-1"
                      aria-label={`Nombre del campo ${index + 1}`}
                      tabIndex={0}
                    />
                    <Select
                      value={field.fieldType}
                      onValueChange={(val) =>
                        handleFieldChange(index, "fieldType", val)
                      }
                    >
                      <SelectTrigger
                        className="w-[160px]"
                        aria-label={`Tipo del campo ${index + 1}`}
                      >
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                      disabled={fields.length <= 1}
                      className="h-8 w-8 shrink-0"
                      tabIndex={0}
                      aria-label={`Eliminar campo ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${orgSlug}/collections`)}
              disabled={isSubmitting}
              tabIndex={0}
              aria-label="Cancelar"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name}
              tabIndex={0}
              aria-label="Crear coleccion"
            >
              {isSubmitting ? "Creando..." : "Crear coleccion"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
