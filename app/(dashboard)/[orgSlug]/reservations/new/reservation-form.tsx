"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createReservation } from "@/src/actions/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";
import type { Service, Resource, Customer } from "@/src/types";

interface NewReservationFormProps {
  orgSlug: string;
  services: Service[];
  resources: Resource[];
  customers: Customer[];
}

export const NewReservationForm = ({
  orgSlug,
  services,
  resources,
  customers,
}: NewReservationFormProps) => {
  const router = useRouter();

  const [serviceId, setServiceId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter resources based on selected service
  const filteredResources = useMemo(() => {
    if (!serviceId) return [];
    return resources.filter(
      (r) => r.serviceId === serviceId && r.isActive,
    );
  }, [serviceId, resources]);

  // Get selected service details
  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [serviceId, services],
  );

  // Calculate end time preview
  const endTimePreview = useMemo(() => {
    if (!date || !time || !selectedService) return null;
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime())) return null;
    const end = new Date(
      start.getTime() + selectedService.durationMinutes * 60 * 1000,
    );
    return end.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [date, time, selectedService]);

  // Reset resource when service changes
  const handleServiceChange = (value: string) => {
    setServiceId(value);
    setResourceId("");
  };

  // Get today's date in YYYY-MM-DD format for min date
  const todayStr = new Date().toISOString().split("T")[0];

  const hasPrerequisites = services.length > 0 && customers.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createReservation(orgSlug, {
      serviceId,
      resourceId,
      customerId,
      date,
      time,
      notes: notes || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear la reserva");
      setIsSubmitting(false);
      return;
    }

    router.push(`/${orgSlug}/reservations`);
  };

  const isFormValid =
    serviceId && resourceId && customerId && date && time;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgSlug}/reservations`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a reservas
          </Link>
        </Button>
      </div>

      {!hasPrerequisites ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <h3 className="mt-4 text-lg font-semibold">
              Requisitos incompletos
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Para crear una reserva necesitas al menos un servicio (con un
              recurso asociado) y un cliente registrado.
            </p>
            <div className="mt-4 flex gap-2">
              {services.length === 0 && (
                <Button variant="outline" asChild>
                  <Link href={`/${orgSlug}/services/new`}>
                    Crear servicio
                  </Link>
                </Button>
              )}
              {customers.length === 0 && (
                <Button variant="outline" asChild>
                  <Link href={`/${orgSlug}/customers/new`}>
                    Registrar cliente
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nueva reserva</CardTitle>
            <CardDescription>
              Selecciona el servicio, recurso, cliente y horario para la reserva
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Minimum data info */}
              <div className="flex gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <strong>Data minima para una reserva:</strong> servicio,
                  recurso, cliente, fecha y hora. La hora de fin se calcula
                  automaticamente segun la duracion del servicio.
                </div>
              </div>

              {/* Service selection */}
              <div className="space-y-2">
                <Label htmlFor="service">Servicio</Label>
                <Select value={serviceId} onValueChange={handleServiceChange}>
                  <SelectTrigger
                    id="service"
                    aria-label="Seleccionar servicio"
                    tabIndex={0}
                  >
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.durationMinutes} min
                        {service.price ? ` - $${service.price}` : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resource selection (filtered by service) */}
              <div className="space-y-2">
                <Label htmlFor="resource">Recurso / Proveedor</Label>
                <Select
                  value={resourceId}
                  onValueChange={setResourceId}
                  disabled={!serviceId}
                >
                  <SelectTrigger
                    id="resource"
                    aria-label="Seleccionar recurso"
                    tabIndex={0}
                  >
                    <SelectValue
                      placeholder={
                        !serviceId
                          ? "Selecciona un servicio primero"
                          : filteredResources.length === 0
                            ? "No hay recursos para este servicio"
                            : "Selecciona un recurso"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredResources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serviceId && filteredResources.length === 0 && (
                  <p className="text-xs text-amber-500">
                    Este servicio no tiene recursos activos.{" "}
                    <Link
                      href={`/${orgSlug}/services`}
                      className="underline"
                    >
                      Agrega uno
                    </Link>
                  </p>
                )}
              </div>

              {/* Customer selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger
                    id="customer"
                    aria-label="Seleccionar cliente"
                    tabIndex={0}
                  >
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.email ? ` (${customer.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    aria-label="Fecha de la reserva"
                    tabIndex={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Hora de inicio</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    aria-label="Hora de inicio"
                    tabIndex={0}
                  />
                </div>
              </div>

              {/* End time preview */}
              {endTimePreview && selectedService && (
                <div className="rounded-md bg-muted/50 p-3 text-sm">
                  <span className="font-medium">Horario estimado:</span>{" "}
                  {time} - {endTimePreview} ({selectedService.durationMinutes}{" "}
                  min)
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Instrucciones especiales, preferencias del cliente..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  aria-label="Notas de la reserva"
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
                onClick={() => router.push(`/${orgSlug}/reservations`)}
                disabled={isSubmitting}
                tabIndex={0}
                aria-label="Cancelar reserva"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                tabIndex={0}
                aria-label="Crear reserva"
              >
                {isSubmitting ? "Creando..." : "Crear reserva"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
};
