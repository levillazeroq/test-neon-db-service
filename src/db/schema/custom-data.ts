import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

export const customFieldTypeEnum = pgEnum("custom_field_type", [
  "text",
  "number",
  "date",
  "datetime",
  "boolean",
  "select",
  "multi_select",
  "email",
  "phone",
  "url",
  "relation",
]);

export const customCollections = pgTable(
  "custom_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("custom_collections_org_id_idx").on(table.organizationId),
  ],
);

export const customFields = pgTable(
  "custom_fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => customCollections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    fieldType: customFieldTypeEnum("field_type").notNull(),
    fieldOrder: integer("field_order").notNull().default(0),
    options: jsonb("options").notNull().default({}),
    isRequired: boolean("is_required").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("custom_fields_collection_id_idx").on(table.collectionId),
  ],
);

export const customRecords = pgTable(
  "custom_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => customCollections.id, { onDelete: "cascade" }),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("custom_records_collection_id_idx").on(table.collectionId),
  ],
);

// Relations
export const customCollectionsRelations = relations(
  customCollections,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [customCollections.organizationId],
      references: [organizations.id],
    }),
    fields: many(customFields),
    records: many(customRecords),
  }),
);

export const customFieldsRelations = relations(customFields, ({ one }) => ({
  collection: one(customCollections, {
    fields: [customFields.collectionId],
    references: [customCollections.id],
  }),
}));

export const customRecordsRelations = relations(customRecords, ({ one }) => ({
  collection: one(customCollections, {
    fields: [customRecords.collectionId],
    references: [customCollections.id],
  }),
}));

// Inferred types
export type CustomCollection = typeof customCollections.$inferSelect;
export type NewCustomCollection = typeof customCollections.$inferInsert;
export type CustomField = typeof customFields.$inferSelect;
export type NewCustomField = typeof customFields.$inferInsert;
export type CustomRecord = typeof customRecords.$inferSelect;
export type NewCustomRecord = typeof customRecords.$inferInsert;
