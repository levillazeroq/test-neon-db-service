"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getServices,
  getResources,
  createService,
  createResource,
  deleteService,
  deleteResource,
} from "@/src/actions/services";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Trash2, UserPlus } from "lucide-react";
import type { Service, Resource } from "@/src/types";

export default function ServicesPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [services, setServices] = useState<Service[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Service form
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceDuration, setServiceDuration] = useState(30);
  const [servicePrice, setServicePrice] = useState("");
  const [isCreatingService, setIsCreatingService] = useState(false);

  // Resource form
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [resourceServiceId, setResourceServiceId] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [isCreatingResource, setIsCreatingResource] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [svc, res] = await Promise.all([
      getServices(orgSlug),
      getResources(orgSlug),
    ]);
    setServices(svc);
    setResources(res);
    setIsLoading(false);
  }, [orgSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateService = async () => {
    setError(null);
    setIsCreatingService(true);

    const result = await createService(orgSlug, {
      name: serviceName,
      description: serviceDescription || undefined,
      durationMinutes: serviceDuration,
      price: servicePrice || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear servicio");
      setIsCreatingService(false);
      return;
    }

    setIsServiceOpen(false);
    setServiceName("");
    setServiceDescription("");
    setServiceDuration(30);
    setServicePrice("");
    setIsCreatingService(false);
    loadData();
  };

  const handleCreateResource = async () => {
    setError(null);
    setIsCreatingResource(true);

    const result = await createResource(orgSlug, {
      serviceId: resourceServiceId,
      name: resourceName,
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear recurso");
      setIsCreatingResource(false);
      return;
    }

    setIsResourceOpen(false);
    setResourceName("");
    setResourceServiceId("");
    setIsCreatingResource(false);
    loadData();
  };

  const handleDeleteService = async (serviceId: string) => {
    await deleteService(orgSlug, serviceId);
    loadData();
  };

  const handleDeleteResource = async (resourceId: string) => {
    await deleteResource(orgSlug, resourceId);
    loadData();
  };

  const getResourcesForService = (serviceId: string) =>
    resources.filter((r) => r.serviceId === serviceId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona los servicios y recursos de tu organizacion
          </p>
        </div>
        <div className="flex gap-2">
          {/* Add Resource Dialog */}
          {services.length > 0 && (
            <Dialog open={isResourceOpen} onOpenChange={setIsResourceOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  tabIndex={0}
                  aria-label="Agregar recurso"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar recurso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo recurso</DialogTitle>
                  <DialogDescription>
                    Un recurso es quien provee el servicio (empleado, sala, mesa,
                    etc.)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Servicio</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={resourceServiceId}
                      onChange={(e) => setResourceServiceId(e.target.value)}
                      aria-label="Seleccionar servicio"
                    >
                      <option value="">Seleccionar servicio...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="res-name">Nombre del recurso</Label>
                    <Input
                      id="res-name"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      placeholder="Ej: Maria Lopez, Sala 1, Mesa 5..."
                      aria-label="Nombre del recurso"
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
                    onClick={() => setIsResourceOpen(false)}
                    disabled={isCreatingResource}
                    tabIndex={0}
                    aria-label="Cancelar"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateResource}
                    disabled={
                      isCreatingResource || !resourceName || !resourceServiceId
                    }
                    tabIndex={0}
                    aria-label="Crear recurso"
                  >
                    {isCreatingResource ? "Creando..." : "Crear recurso"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Add Service Dialog */}
          <Dialog open={isServiceOpen} onOpenChange={setIsServiceOpen}>
            <DialogTrigger asChild>
              <Button tabIndex={0} aria-label="Nuevo servicio">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo servicio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo servicio</DialogTitle>
                <DialogDescription>
                  Define un servicio que tu organizacion ofrece
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="svc-name">Nombre</Label>
                  <Input
                    id="svc-name"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Ej: Corte de pelo, Consulta medica..."
                    autoFocus
                    aria-label="Nombre del servicio"
                    tabIndex={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="svc-desc">Descripcion (opcional)</Label>
                  <Textarea
                    id="svc-desc"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Descripcion del servicio..."
                    rows={2}
                    aria-label="Descripcion del servicio"
                    tabIndex={0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="svc-duration">Duracion (minutos)</Label>
                    <Input
                      id="svc-duration"
                      type="number"
                      value={serviceDuration}
                      onChange={(e) =>
                        setServiceDuration(Number(e.target.value))
                      }
                      min={5}
                      max={480}
                      aria-label="Duracion en minutos"
                      tabIndex={0}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="svc-price">Precio (opcional)</Label>
                    <Input
                      id="svc-price"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="0.00"
                      aria-label="Precio del servicio"
                      tabIndex={0}
                    />
                  </div>
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
                  onClick={() => setIsServiceOpen(false)}
                  disabled={isCreatingService}
                  tabIndex={0}
                  aria-label="Cancelar"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateService}
                  disabled={isCreatingService || !serviceName}
                  tabIndex={0}
                  aria-label="Crear servicio"
                >
                  {isCreatingService ? "Creando..." : "Crear servicio"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay servicios</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu primer servicio para empezar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {services.map((service) => {
            const serviceResources = getResourcesForService(service.id);
            return (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.description && (
                        <CardDescription>
                          {service.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {service.durationMinutes} min
                      </Badge>
                      {service.price && (
                        <Badge variant="outline">${service.price}</Badge>
                      )}
                      <Badge
                        variant={service.isActive ? "default" : "secondary"}
                      >
                        {service.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteService(service.id)}
                        aria-label={`Eliminar servicio ${service.name}`}
                        tabIndex={0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {serviceResources.length > 0 && (
                  <CardContent>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Recursos ({serviceResources.length})
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="w-[100px]">Estado</TableHead>
                          <TableHead className="w-[60px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceResources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>{resource.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  resource.isActive ? "default" : "secondary"
                                }
                              >
                                {resource.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  handleDeleteResource(resource.id)
                                }
                                aria-label={`Eliminar recurso ${resource.name}`}
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
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
