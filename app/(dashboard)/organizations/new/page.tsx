"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrganization } from "@/src/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isAutoSlug, setIsAutoSlug] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (isAutoSlug) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setIsAutoSlug(false);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createOrganization({ name, slug });

    if (!result.success) {
      setError(result.error ?? "Error al crear la organizacion");
      setIsSubmitting(false);
      return;
    }

    router.push("/organizations");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva organizacion</CardTitle>
          <CardDescription>
            Crea una nueva organizacion para gestionar servicios y reservas
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Mi Organizacion"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                aria-label="Nombre de la organizacion"
                tabIndex={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/</span>
                <Input
                  id="slug"
                  placeholder="mi-organizacion"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  aria-label="Slug de la organizacion"
                  tabIndex={0}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se usara como identificador en la URL. Solo letras minusculas,
                numeros y guiones.
              </p>
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
              onClick={() => router.push("/organizations")}
              disabled={isSubmitting}
              tabIndex={0}
              aria-label="Cancelar creacion"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name || !slug}
              tabIndex={0}
              aria-label="Crear organizacion"
            >
              {isSubmitting ? "Creando..." : "Crear organizacion"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
