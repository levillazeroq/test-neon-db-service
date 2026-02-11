"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer } from "@/src/actions/customers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface DeleteCustomerButtonProps {
  orgSlug: string;
  customerId: string;
  customerName: string;
}

export const DeleteCustomerButton = ({
  orgSlug,
  customerId,
  customerName,
}: DeleteCustomerButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteCustomer(orgSlug, customerId);

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(
        result.error ?? "Error al eliminar. Puede tener reservas asociadas.",
      );
    }

    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={`Eliminar ${customerName}`}
          tabIndex={0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            Estas seguro de que deseas eliminar a &quot;{customerName}&quot;?
            Esta accion no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
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
            disabled={isDeleting}
            tabIndex={0}
            aria-label="Cancelar eliminacion"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            tabIndex={0}
            aria-label="Confirmar eliminacion"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
