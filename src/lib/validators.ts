import { z } from "zod/v4";

// --- Organization Validators ---

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(50, "El slug no puede exceder 50 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener letras minusculas, numeros y guiones",
    ),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updateOrganizationTierSchema = z.object({
  tier: z.enum(["shared", "dedicated"]),
  databaseUrl: z
    .string()
    .url("La URL de la base de datos no es valida")
    .startsWith("postgresql://", "La URL debe comenzar con postgresql://")
    .optional(),
}).refine(
  (data) => {
    if (data.tier === "dedicated" && !data.databaseUrl) {
      return false;
    }
    return true;
  },
  { message: "Se requiere la URL de la base de datos para el tier dedicado" },
);

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateOrganizationTierInput = z.infer<typeof updateOrganizationTierSchema>;

// --- Service Validators ---

export const createServiceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  description: z.string().max(1000).optional(),
  durationMinutes: z
    .number()
    .int()
    .min(5, "La duracion minima es 5 minutos")
    .max(480, "La duracion maxima es 8 horas"),
  price: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

// --- Resource Validators ---

export const createResourceSchema = z.object({
  serviceId: z.string().uuid("ID de servicio invalido"),
  name: z.string().min(1, "El nombre es requerido").max(200),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;

// --- Resource Schedule Validators ---

export const createResourceScheduleSchema = z.object({
  resourceId: z.string().uuid("ID de recurso invalido"),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  isAvailable: z.boolean().default(true),
});

export type CreateResourceScheduleInput = z.infer<typeof createResourceScheduleSchema>;

// --- Customer Validators ---

export const createCustomerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  email: z.email("Email invalido").optional(),
  phone: z.string().max(20).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// --- Reservation Validators ---

/**
 * Minimum data required to create a reservation:
 * - serviceId: Which service is being booked
 * - resourceId: Which resource/provider will deliver the service
 * - customerId: Who is making the reservation
 * - date: The date of the reservation (YYYY-MM-DD)
 * - time: The start time (HH:mm)
 * - notes: Optional notes
 *
 * The endTime is calculated automatically from the service's durationMinutes.
 * Status defaults to "pending".
 */
export const createReservationSchema = z.object({
  serviceId: z.string().uuid("Selecciona un servicio"),
  resourceId: z.string().uuid("Selecciona un recurso"),
  customerId: z.string().uuid("Selecciona un cliente"),
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "La hora es requerida"),
  notes: z.string().max(500).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const updateReservationStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]),
});

export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>;

// --- Custom Collection Validators ---

export const createCollectionSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

// --- Custom Field Validators ---

export const customFieldTypeValues = [
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
] as const;

export const createFieldSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  fieldType: z.enum(customFieldTypeValues),
  isRequired: z.boolean().default(false),
  options: z.record(z.string(), z.unknown()).optional(),
});

export type CreateFieldInput = z.infer<typeof createFieldSchema>;

// --- Custom Record Validators ---

export const createRecordSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;

// --- Bulk Import Validator ---

export const bulkImportRecordsSchema = z.object({
  records: z.array(z.record(z.string(), z.unknown())).min(1, "Se requiere al menos un registro"),
});

export type BulkImportRecordsInput = z.infer<typeof bulkImportRecordsSchema>;
