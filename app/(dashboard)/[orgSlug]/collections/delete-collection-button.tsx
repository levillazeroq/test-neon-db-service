"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCollection } from "@/src/actions/collections";
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

interface DeleteCollectionButtonProps {
  orgSlug: string;
  collectionId: string;
  collectionName: string;
}

export const DeleteCollectionButton = ({
  orgSlug,
  collectionId,
  collectionName,
}: DeleteCollectionButtonProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCollection(orgSlug, collectionId);
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
          aria-label={`Eliminar coleccion ${collectionName}`}
          tabIndex={0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar coleccion</DialogTitle>
          <DialogDescription>
            Esta accion eliminara la coleccion &quot;{collectionName}&quot; y
            todos sus registros. Esta accion no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
            tabIndex={0}
            aria-label="Cancelar"
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
