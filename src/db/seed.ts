import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

const main = async () => {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(schema.reservations);
  await db.delete(schema.customRecords);
  await db.delete(schema.customFields);
  await db.delete(schema.customCollections);
  await db.delete(schema.resourceSchedules);
  await db.delete(schema.resources);
  await db.delete(schema.services);
  await db.delete(schema.customers);
  await db.delete(schema.organizationMembers);
  await db.delete(schema.organizations);

  // Create demo organizations
  const [org1, org2] = await db
    .insert(schema.organizations)
    .values([
      {
        name: "Salon de Belleza Luna",
        slug: "salon-luna",
        tier: "shared",
        settings: { timezone: "America/Mexico_City", currency: "MXN" },
      },
      {
        name: "Clinica Dental Sonrisa",
        slug: "clinica-sonrisa",
        tier: "shared",
        settings: { timezone: "America/Mexico_City", currency: "MXN" },
      },
    ])
    .returning();

  console.log(`Created organizations: ${org1.name}, ${org2.name}`);

  // Create services for org1
  const [service1, service2] = await db
    .insert(schema.services)
    .values([
      {
        organizationId: org1.id,
        name: "Corte de Cabello",
        description: "Corte clasico o moderno",
        durationMinutes: 30,
        price: "150.00",
      },
      {
        organizationId: org1.id,
        name: "Manicure",
        description: "Manicure con gel o acrilico",
        durationMinutes: 45,
        price: "200.00",
      },
    ])
    .returning();

  console.log(`Created services: ${service1.name}, ${service2.name}`);

  // Create resources for org1
  const [resource1] = await db
    .insert(schema.resources)
    .values([
      {
        organizationId: org1.id,
        serviceId: service1.id,
        name: "Maria Garcia",
      },
      {
        organizationId: org1.id,
        serviceId: service2.id,
        name: "Ana Lopez",
      },
    ])
    .returning();

  // Create schedules for resource1 (Mon-Fri 9:00-18:00)
  const schedules = [1, 2, 3, 4, 5].map((day) => ({
    resourceId: resource1.id,
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "18:00",
    isAvailable: true,
  }));

  await db.insert(schema.resourceSchedules).values(schedules);
  console.log("Created resource schedules");

  // Create customers for org1
  const [customer1] = await db
    .insert(schema.customers)
    .values([
      {
        organizationId: org1.id,
        name: "Juan Perez",
        email: "juan@example.com",
        phone: "+52 55 1234 5678",
      },
      {
        organizationId: org1.id,
        name: "Laura Martinez",
        email: "laura@example.com",
        phone: "+52 55 8765 4321",
      },
    ])
    .returning();

  console.log("Created customers");

  // Create a sample reservation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const endTime = new Date(tomorrow);
  endTime.setMinutes(endTime.getMinutes() + service1.durationMinutes);

  await db.insert(schema.reservations).values({
    organizationId: org1.id,
    serviceId: service1.id,
    resourceId: resource1.id,
    customerId: customer1.id,
    startTime: tomorrow,
    endTime: endTime,
    status: "confirmed",
    notes: "Primera visita",
  });

  console.log("Created sample reservation");

  // Create a custom collection for org1
  const [collection] = await db
    .insert(schema.customCollections)
    .values({
      organizationId: org1.id,
      name: "Inventario de Productos",
      description: "Control de stock de productos del salon",
      icon: "package",
    })
    .returning();

  // Create custom fields
  await db.insert(schema.customFields).values([
    {
      collectionId: collection.id,
      name: "Producto",
      fieldType: "text",
      fieldOrder: 0,
      isRequired: true,
    },
    {
      collectionId: collection.id,
      name: "Precio",
      fieldType: "number",
      fieldOrder: 1,
      isRequired: true,
    },
    {
      collectionId: collection.id,
      name: "Categoria",
      fieldType: "select",
      fieldOrder: 2,
      options: { choices: ["Shampoo", "Tinte", "Tratamiento", "Accesorio"] },
    },
    {
      collectionId: collection.id,
      name: "En Stock",
      fieldType: "boolean",
      fieldOrder: 3,
    },
  ]);

  // Create sample custom records
  const fields = await db.query.customFields.findMany({
    where: (f, { eq }) => eq(f.collectionId, collection.id),
    orderBy: (f, { asc }) => [asc(f.fieldOrder)],
  });

  const fieldMap = Object.fromEntries(fields.map((f) => [f.name, f.id]));

  await db.insert(schema.customRecords).values([
    {
      collectionId: collection.id,
      data: {
        [fieldMap["Producto"]]: "Shampoo Profesional",
        [fieldMap["Precio"]]: 250,
        [fieldMap["Categoria"]]: "Shampoo",
        [fieldMap["En Stock"]]: true,
      },
    },
    {
      collectionId: collection.id,
      data: {
        [fieldMap["Producto"]]: "Tinte Rubio Platino",
        [fieldMap["Precio"]]: 180,
        [fieldMap["Categoria"]]: "Tinte",
        [fieldMap["En Stock"]]: true,
      },
    },
    {
      collectionId: collection.id,
      data: {
        [fieldMap["Producto"]]: "Aceite de Argan",
        [fieldMap["Precio"]]: 350,
        [fieldMap["Categoria"]]: "Tratamiento",
        [fieldMap["En Stock"]]: false,
      },
    },
  ]);

  console.log("Created custom collection with fields and records");
  console.log("Seed completed successfully!");
};

main().catch(console.error);
