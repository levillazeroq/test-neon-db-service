"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createCustomer } from "@/src/actions/customers";
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

export default function NewCustomerPage() {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createCustomer(orgSlug, {
      name,
      email: email || undefined,
      phone: phone || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Error al registrar el cliente");
      setIsSubmitting(false);
      return;
    }

    router.push(`/${orgSlug}/customers`);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgSlug}/customers`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a clientes
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo cliente</CardTitle>
          <CardDescription>
            Registra un nuevo cliente para poder crear reservas a su nombre
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Juan Perez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                aria-label="Nombre del cliente"
                tabIndex={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email del cliente"
                tabIndex={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+52 55 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="Telefono del cliente"
                tabIndex={0}
              />
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
              onClick={() => router.push(`/${orgSlug}/customers`)}
              disabled={isSubmitting}
              tabIndex={0}
              aria-label="Cancelar registro"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name}
              tabIndex={0}
              aria-label="Registrar cliente"
            >
              {isSubmitting ? "Registrando..." : "Registrar cliente"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
