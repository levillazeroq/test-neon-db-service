"use server";

import { revalidatePath } from "next/cache";
import { getDbForOrg } from "@/src/db";
import { reservations, services } from "@/src/db/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";
import {
  createReservationSchema,
  updateReservationStatusSchema,
  type CreateReservationInput,
  type UpdateReservationStatusInput,
} from "@/src/lib/validators";
import type { ActionResult, Reservation } from "@/src/types";

/** Reservation with related entity names for display */
export interface ReservationWithDetails extends Reservation {
  serviceName: string;
  resourceName: string;
  customerName: string;
  customerEmail: string | null;
  serviceDuration: number;
}

/**
 * Fetch all reservations for an organization with related details.
 * Alias: getReservations (used in dashboard).
 */
export const getReservationsWithDetails = async (
  orgSlug: string,
): Promise<ReservationWithDetails[]> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const results = await db.query.reservations.findMany({
    where: eq(reservations.organizationId, orgId),
    with: {
      service: true,
      resource: true,
      customer: true,
    },
    orderBy: (r, { desc }) => [desc(r.startTime)],
  });

  return results.map((r) => ({
    ...r,
    serviceName: r.service.name,
    resourceName: r.resource.name,
    customerName: r.customer.name,
    customerEmail: r.customer.email,
    serviceDuration: r.service.durationMinutes,
  }));
};

/** Get reservation counts by status for an organization */
export const getReservationCounts = async (
  orgSlug: string,
): Promise<{ total: number; pending: number; confirmed: number }> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const [totalResult] = await db
    .select({ count: count() })
    .from(reservations)
    .where(eq(reservations.organizationId, orgId));

  const [pendingResult] = await db
    .select({ count: count() })
    .from(reservations)
    .where(
      and(
        eq(reservations.organizationId, orgId),
        eq(reservations.status, "pending"),
      ),
    );

  const [confirmedResult] = await db
    .select({ count: count() })
    .from(reservations)
    .where(
      and(
        eq(reservations.organizationId, orgId),
        eq(reservations.status, "confirmed"),
      ),
    );

  return {
    total: totalResult?.count ?? 0,
    pending: pendingResult?.count ?? 0,
    confirmed: confirmedResult?.count ?? 0,
  };
};

/**
 * Create a new reservation.
 *
 * The endTime is automatically calculated from the service's durationMinutes.
 * Status defaults to "pending".
 */
export const createReservation = async (
  orgSlug: string,
  input: CreateReservationInput,
): Promise<ActionResult<Reservation>> => {
  const parsed = createReservationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos invalidos",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  // Get the service to calculate endTime from duration
  const service = await db.query.services.findFirst({
    where: and(
      eq(services.id, parsed.data.serviceId),
      eq(services.organizationId, orgId),
    ),
  });

  if (!service) {
    return { success: false, error: "Servicio no encontrado" };
  }

  // Build start and end times from date + time
  const startTime = new Date(`${parsed.data.date}T${parsed.data.time}:00`);

  if (isNaN(startTime.getTime())) {
    return { success: false, error: "Fecha u hora invalida" };
  }

  const endTime = new Date(
    startTime.getTime() + service.durationMinutes * 60 * 1000,
  );

  // Check for conflicts: same resource at overlapping times
  const conflicts = await db.query.reservations.findMany({
    where: and(
      eq(reservations.organizationId, orgId),
      eq(reservations.resourceId, parsed.data.resourceId),
      lte(reservations.startTime, endTime),
      gte(reservations.endTime, startTime),
    ),
  });

  const activeConflicts = conflicts.filter(
    (r) => r.status !== "cancelled" && r.status !== "no_show",
  );

  if (activeConflicts.length > 0) {
    return {
      success: false,
      error: "El recurso ya tiene una reserva en ese horario",
    };
  }

  const [reservation] = await db
    .insert(reservations)
    .values({
      organizationId: orgId,
      serviceId: parsed.data.serviceId,
      resourceId: parsed.data.resourceId,
      customerId: parsed.data.customerId,
      startTime,
      endTime,
      status: "pending",
      notes: parsed.data.notes ?? null,
    })
    .returning();

  revalidatePath(`/${orgSlug}/reservations`);
  revalidatePath(`/${orgSlug}`);

  return { success: true, data: reservation };
};

/** Update the status of a reservation */
export const updateReservationStatus = async (
  orgSlug: string,
  reservationId: string,
  input: UpdateReservationStatusInput,
): Promise<ActionResult<Reservation>> => {
  const parsed = updateReservationStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Estado invalido",
    };
  }

  const { db, orgId } = await getDbForOrg(orgSlug);

  const [updated] = await db
    .update(reservations)
    .set({ status: parsed.data.status })
    .where(
      and(
        eq(reservations.id, reservationId),
        eq(reservations.organizationId, orgId),
      ),
    )
    .returning();

  if (!updated) {
    return { success: false, error: "Reserva no encontrada" };
  }

  revalidatePath(`/${orgSlug}/reservations`);
  revalidatePath(`/${orgSlug}`);

  return { success: true, data: updated };
};

/** Delete a reservation */
export const deleteReservation = async (
  orgSlug: string,
  reservationId: string,
): Promise<ActionResult> => {
  const { db, orgId } = await getDbForOrg(orgSlug);

  const [deleted] = await db
    .delete(reservations)
    .where(
      and(
        eq(reservations.id, reservationId),
        eq(reservations.organizationId, orgId),
      ),
    )
    .returning();

  if (!deleted) {
    return { success: false, error: "Reserva no encontrada" };
  }

  revalidatePath(`/${orgSlug}/reservations`);
  revalidatePath(`/${orgSlug}`);

  return { success: true };
};

/** Alias for getReservationsWithDetails (used in dashboard) */
export const getReservations = getReservationsWithDetails;
