"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteOrganization } from "@/src/actions/organizations";
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

interface DeleteOrganizationButtonProps {
  orgId: string;
  orgName: string;
}

export const DeleteOrganizationButton = ({
  orgId,
  orgName,
}: DeleteOrganizationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteOrganization(orgId);

    if (result.success) {
      setIsOpen(false);
      router.refresh();
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
          aria-label={`Eliminar ${orgName}`}
          tabIndex={0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar organizacion</DialogTitle>
          <DialogDescription>
            Estas seguro de que deseas eliminar &quot;{orgName}&quot;? Esta
            accion eliminara todos los datos asociados y no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
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
