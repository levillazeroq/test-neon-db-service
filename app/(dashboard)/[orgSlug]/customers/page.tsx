"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
} from "@/src/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
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
import { Users, Plus, Trash2 } from "lucide-react";
import type { Customer } from "@/src/types";

export default function CustomersPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const data = await getCustomers(orgSlug);
    setCustomers(data);
    setIsLoading(false);
  }, [orgSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    const result = await createCustomer(orgSlug, {
      name,
      email: email || undefined,
      phone: phone || undefined,
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear cliente");
      setIsCreating(false);
      return;
    }

    setIsOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setIsCreating(false);
    loadData();
  };

  const handleDelete = async (customerId: string) => {
    await deleteCustomer(orgSlug, customerId);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes de tu organizacion
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button tabIndex={0} aria-label="Nuevo cliente">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
              <DialogDescription>
                Agrega un nuevo cliente a tu organizacion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                  autoFocus
                  aria-label="Nombre del cliente"
                  tabIndex={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-email">Email (opcional)</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  aria-label="Email del cliente"
                  tabIndex={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Telefono (opcional)</Label>
                <Input
                  id="cust-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  aria-label="Telefono del cliente"
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
                disabled={isCreating || !name}
                tabIndex={0}
                aria-label="Crear cliente"
              >
                {isCreating ? "Creando..." : "Crear cliente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay clientes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega tu primer cliente para poder crear reservas
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.email || "—"}</TableCell>
                    <TableCell>{customer.phone || "—"}</TableCell>
                    <TableCell>
                      {new Date(customer.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(customer.id)}
                        aria-label={`Eliminar cliente ${customer.name}`}
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
