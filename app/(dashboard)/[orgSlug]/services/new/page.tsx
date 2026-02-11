"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createService } from "@/src/actions/services";
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
import { ArrowLeft } from "lucide-react";

export default function NewServicePage() {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration < 5) {
      setError("La duracion debe ser al menos 5 minutos");
      setIsSubmitting(false);
      return;
    }

    const result = await createService(orgSlug, {
      name,
      description: description || undefined,
      durationMinutes: duration,
      price: price || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear el servicio");
      setIsSubmitting(false);
      return;
    }

    router.push(`/${orgSlug}/services`);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgSlug}/services`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a servicios
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo servicio</CardTitle>
          <CardDescription>
            Define un servicio que tu organizacion ofrece a sus clientes
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del servicio</Label>
              <Input
                id="name"
                placeholder="Ej: Corte de cabello, Consulta dental..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                aria-label="Nombre del servicio"
                tabIndex={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente el servicio..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                aria-label="Descripcion del servicio"
                tabIndex={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duracion (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={480}
                  placeholder="30"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  required
                  aria-label="Duracion en minutos"
                  tabIndex={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio (opcional)</Label>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="150.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-label="Precio del servicio"
                  tabIndex={0}
                />
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
              onClick={() => router.push(`/${orgSlug}/services`)}
              disabled={isSubmitting}
              tabIndex={0}
              aria-label="Cancelar creacion"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name || !durationMinutes}
              tabIndex={0}
              aria-label="Crear servicio"
            >
              {isSubmitting ? "Creando..." : "Crear servicio"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
