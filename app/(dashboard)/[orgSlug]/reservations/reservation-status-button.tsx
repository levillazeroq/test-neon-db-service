"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateReservationStatus,
  deleteReservation,
} from "@/src/actions/reservations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  MoreHorizontal,
  Trash2,
  CheckCheck,
} from "lucide-react";

interface ReservationStatusButtonProps {
  orgSlug: string;
  reservationId: string;
  currentStatus: string;
}

const STATUS_TRANSITIONS: Record<
  string,
  { label: string; status: string; icon: React.ElementType }[]
> = {
  pending: [
    { label: "Confirmar", status: "confirmed", icon: CheckCircle },
    { label: "Cancelar", status: "cancelled", icon: XCircle },
  ],
  confirmed: [
    { label: "Completar", status: "completed", icon: CheckCheck },
    { label: "Cancelar", status: "cancelled", icon: XCircle },
    { label: "No asistio", status: "no_show", icon: UserX },
  ],
  cancelled: [
    { label: "Reabrir (Pendiente)", status: "pending", icon: Clock },
  ],
  completed: [],
  no_show: [
    { label: "Reabrir (Pendiente)", status: "pending", icon: Clock },
  ],
};

export const ReservationStatusButton = ({
  orgSlug,
  reservationId,
  currentStatus,
}: ReservationStatusButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    await updateReservationStatus(orgSlug, reservationId, {
      status: newStatus as "pending" | "confirmed" | "cancelled" | "completed" | "no_show",
    });
    setIsLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setIsLoading(true);
    await deleteReservation(orgSlug, reservationId);
    setIsLoading(false);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isLoading}
          aria-label="Acciones de reserva"
          tabIndex={0}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {transitions.map((transition) => (
          <DropdownMenuItem
            key={transition.status}
            onClick={() => handleStatusChange(transition.status)}
            disabled={isLoading}
          >
            <transition.icon className="mr-2 h-4 w-4" />
            {transition.label}
          </DropdownMenuItem>
        ))}
        {transitions.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
