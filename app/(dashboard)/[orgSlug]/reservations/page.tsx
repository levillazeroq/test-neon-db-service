"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  getReservations,
  createReservation,
  updateReservationStatus,
  deleteReservation,
} from "@/src/actions/reservations";
import type { ReservationWithDetails } from "@/src/actions/reservations";
import { getServices, getResources } from "@/src/actions/services";
import { getCustomers } from "@/src/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Trash2, Info } from "lucide-react";
import type { Service, Resource, Customer } from "@/src/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No se presento",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
  no_show: "destructive",
};

export default function ReservationsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [resv, svc, res, cust] = await Promise.all([
      getReservations(orgSlug),
      getServices(orgSlug),
      getResources(orgSlug),
      getCustomers(orgSlug),
    ]);
    setReservations(resv);
    setServices(svc);
    setResources(res);
    setCustomers(cust);
    setIsLoading(false);
  }, [orgSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter resources by selected service
  const filteredResources = selectedServiceId
    ? resources.filter((r) => r.serviceId === selectedServiceId)
    : [];

  // Calculate end time from service duration
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const calculatedEndTime = (() => {
    if (!date || !time || !selectedService) return "";
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime())) return "";
    const end = new Date(
      start.getTime() + selectedService.durationMinutes * 60000,
    );
    return end.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    if (
      !selectedServiceId ||
      !selectedResourceId ||
      !selectedCustomerId ||
      !date ||
      !time
    ) {
      setError("Todos los campos obligatorios deben estar completos");
      setIsCreating(false);
      return;
    }

    const result = await createReservation(orgSlug, {
      serviceId: selectedServiceId,
      resourceId: selectedResourceId,
      customerId: selectedCustomerId,
      date,
      time,
      notes: notes || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear reserva");
      setIsCreating(false);
      return;
    }

    setIsOpen(false);
    resetForm();
    setIsCreating(false);
    loadData();
  };

  const resetForm = () => {
    setSelectedServiceId("");
    setSelectedResourceId("");
    setSelectedCustomerId("");
    setDate("");
    setTime("");
    setNotes("");
    setError(null);
  };

  const handleStatusChange = async (reservationId: string, status: string) => {
    await updateReservationStatus(orgSlug, reservationId, {
      status: status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show",
    });
    loadData();
  };

  const handleDelete = async (reservationId: string) => {
    await deleteReservation(orgSlug, reservationId);
    loadData();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) resetForm();
  };

  const isFormReady =
    services.length > 0 && customers.length > 0 && resources.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
          <p className="text-muted-foreground">
            Gestiona las reservas de tu organizacion
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              disabled={!isFormReady}
              tabIndex={0}
              aria-label="Nueva reserva"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva reserva</DialogTitle>
              <DialogDescription>
                Crea una nueva reserva seleccionando servicio, recurso, cliente y
                horario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Service */}
              <div className="space-y-1.5">
                <Label>
                  Servicio <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={(val) => {
                    setSelectedServiceId(val);
                    setSelectedResourceId("");
                  }}
                >
                  <SelectTrigger aria-label="Seleccionar servicio">
                    <SelectValue placeholder="Seleccionar servicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.durationMinutes} min
                        {s.price ? ` - $${s.price}` : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resource */}
              <div className="space-y-1.5">
                <Label>
                  Recurso <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedResourceId}
                  onValueChange={setSelectedResourceId}
                  disabled={
                    !selectedServiceId || filteredResources.length === 0
                  }
                >
                  <SelectTrigger aria-label="Seleccionar recurso">
                    <SelectValue
                      placeholder={
                        filteredResources.length === 0
                          ? "No hay recursos para este servicio"
                          : "Seleccionar recurso..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredResources.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer */}
              <div className="space-y-1.5">
                <Label>
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger aria-label="Seleccionar cliente">
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.email ? ` (${c.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="res-date">
                    Fecha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="res-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-label="Fecha de la reserva"
                    tabIndex={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="res-time">
                    Hora <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="res-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    aria-label="Hora de la reserva"
                    tabIndex={0}
                  />
                </div>
              </div>
              {calculatedEndTime && (
                <p className="text-xs text-muted-foreground">
                  Fin estimado: {calculatedEndTime} (
                  {selectedService?.durationMinutes} min)
                </p>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="res-notes">Notas (opcional)</Label>
                <Textarea
                  id="res-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={2}
                  aria-label="Notas de la reserva"
                  tabIndex={0}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isCreating}
                tabIndex={0}
                aria-label="Cancelar"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  isCreating ||
                  !selectedServiceId ||
                  !selectedResourceId ||
                  !selectedCustomerId ||
                  !date ||
                  !time
                }
                tabIndex={0}
                aria-label="Crear reserva"
              >
                {isCreating ? "Creando..." : "Crear reserva"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Minimum data requirements info */}
      {!isFormReady && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Datos minimos para crear una reserva
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-amber-700 dark:text-amber-300">
                <li>
                  <strong>Servicio</strong> - que se va a reservar (ej: Corte de
                  pelo, Consulta){" "}
                  {services.length > 0 ? "✓" : "— falta crear en Servicios"}
                </li>
                <li>
                  <strong>Recurso</strong> - quien lo provee (ej: Maria, Sala 1){" "}
                  {resources.length > 0 ? "✓" : "— falta crear en Servicios"}
                </li>
                <li>
                  <strong>Cliente</strong> - quien reserva{" "}
                  {customers.length > 0 ? "✓" : "— falta crear en Clientes"}
                </li>
                <li>
                  <strong>Fecha y hora</strong> - cuando sera la reserva
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data definition card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Definicion de datos minimos para una reserva
          </CardTitle>
          <CardDescription>
            Cada reserva requiere estos campos obligatorios. El horario de fin se
            calcula automaticamente desde la duracion del servicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Servicio</p>
              <p className="text-xs text-muted-foreground">
                Nombre, duracion (min), precio
              </p>
              <Badge variant="secondary" className="mt-2">
                {services.length} registrado{services.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Recurso</p>
              <p className="text-xs text-muted-foreground">
                Nombre, servicio asociado
              </p>
              <Badge variant="secondary" className="mt-2">
                {resources.length} registrado{resources.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Cliente</p>
              <p className="text-xs text-muted-foreground">
                Nombre, email, telefono
              </p>
              <Badge variant="secondary" className="mt-2">
                {customers.length} registrado{customers.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">Horario</p>
              <p className="text-xs text-muted-foreground">
                Fecha + hora inicio. Fin auto-calculado.
              </p>
              <Badge variant="outline" className="mt-2">
                Requerido
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservations list */}
      {reservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay reservas</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFormReady
                ? "Crea tu primera reserva"
                : "Primero agrega servicios, recursos y clientes"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {new Date(reservation.startTime).toLocaleDateString(
                            "es-MX",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reservation.startTime).toLocaleTimeString(
                            "es-MX",
                            { hour: "2-digit", minute: "2-digit" },
                          )}{" "}
                          -{" "}
                          {new Date(reservation.endTime).toLocaleTimeString(
                            "es-MX",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.serviceName}</TableCell>
                    <TableCell>{reservation.resourceName}</TableCell>
                    <TableCell>
                      <div>
                        <p>{reservation.customerName}</p>
                        {reservation.customerEmail && (
                          <p className="text-xs text-muted-foreground">
                            {reservation.customerEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={reservation.status}
                        onValueChange={(val) =>
                          handleStatusChange(reservation.id, val)
                        }
                      >
                        <SelectTrigger
                          className="h-7 w-[140px]"
                          aria-label="Cambiar estado"
                        >
                          <Badge
                            variant={
                              STATUS_VARIANTS[reservation.status] ?? "secondary"
                            }
                          >
                            {STATUS_LABELS[reservation.status] ??
                              reservation.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                      {reservation.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(reservation.id)}
                        aria-label="Eliminar reserva"
                        tabIndex={0}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
