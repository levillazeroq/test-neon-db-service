"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteService } from "@/src/actions/services";
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

interface DeleteServiceButtonProps {
  orgSlug: string;
  serviceId: string;
  serviceName: string;
}

export const DeleteServiceButton = ({
  orgSlug,
  serviceId,
  serviceName,
}: DeleteServiceButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteService(orgSlug, serviceId);

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Error al eliminar el servicio");
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
          aria-label={`Eliminar ${serviceName}`}
          tabIndex={0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar servicio</DialogTitle>
          <DialogDescription>
            Estas seguro de que deseas eliminar &quot;{serviceName}&quot;? Se
            eliminaran tambien todos los recursos asociados. Esta accion no se
            puede deshacer.
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
