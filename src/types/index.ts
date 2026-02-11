/** Generic server action response */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Organization tier types */
export type OrganizationTier = "shared" | "dedicated";

/** Reservation status types */
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

/** Custom field type options */
export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multi_select"
  | "email"
  | "phone"
  | "url"
  | "relation";

// Re-export schema types for convenience
export type {
  Organization,
  NewOrganization,
  OrganizationMember,
  NewOrganizationMember,
  Service,
  NewService,
  Resource,
  NewResource,
  ResourceSchedule,
  NewResourceSchedule,
  Customer,
  NewCustomer,
  Reservation,
  NewReservation,
  CustomCollection,
  NewCustomCollection,
  CustomField,
  NewCustomField,
  CustomRecord,
  NewCustomRecord,
} from "@/src/db/schema";
