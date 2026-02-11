import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { services } from "./services";
import { resources } from "./services";
import { customers } from "./customers";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: reservationStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("reservations_org_id_idx").on(table.organizationId),
    index("reservations_org_start_idx").on(
      table.organizationId,
      table.startTime,
    ),
    index("reservations_status_idx").on(table.status),
    index("reservations_resource_id_idx").on(table.resourceId),
    index("reservations_customer_id_idx").on(table.customerId),
  ],
);

// Relations
export const reservationsRelations = relations(reservations, ({ one }) => ({
  organization: one(organizations, {
    fields: [reservations.organizationId],
    references: [organizations.id],
  }),
  service: one(services, {
    fields: [reservations.serviceId],
    references: [services.id],
  }),
  resource: one(resources, {
    fields: [reservations.resourceId],
    references: [resources.id],
  }),
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
}));

// Inferred types
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
