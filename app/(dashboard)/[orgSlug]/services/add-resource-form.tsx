"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createResource } from "@/src/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface AddResourceFormProps {
  orgSlug: string;
  serviceId: string;
}

export const AddResourceForm = ({
  orgSlug,
  serviceId,
}: AddResourceFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createResource(orgSlug, {
      serviceId,
      name,
    });

    if (result.success) {
      setName("");
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Error al crear el recurso");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="mt-2"
        aria-label="Agregar recurso"
        tabIndex={0}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Agregar recurso
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <Input
        placeholder="Nombre del recurso"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 max-w-xs text-sm"
        autoFocus
        required
        aria-label="Nombre del recurso"
        tabIndex={0}
      />
      <Button
        type="submit"
        size="sm"
        className="h-8"
        disabled={isSubmitting || !name}
        tabIndex={0}
        aria-label="Confirmar agregar recurso"
      >
        {isSubmitting ? "..." : "Agregar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setIsOpen(false);
          setName("");
          setError(null);
        }}
        tabIndex={0}
        aria-label="Cancelar"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </form>
  );
};
