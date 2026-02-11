// Platform tables
export {
  organizations,
  organizationMembers,
  organizationTierEnum,
  organizationMemberRoleEnum,
  organizationsRelations,
  organizationMembersRelations,
} from "./organizations";

// Services & Resources
export {
  services,
  resources,
  resourceSchedules,
  servicesRelations,
  resourcesRelations,
  resourceSchedulesRelations,
} from "./services";

// Customers
export {
  customers,
  customersRelations,
} from "./customers";

// Reservations
export {
  reservations,
  reservationStatusEnum,
  reservationsRelations,
} from "./reservations";

// Custom Data (Notion/Airtable-like)
export {
  customCollections,
  customFields,
  customRecords,
  customFieldTypeEnum,
  customCollectionsRelations,
  customFieldsRelations,
  customRecordsRelations,
} from "./custom-data";

// Re-export types
export type {
  Organization,
  NewOrganization,
  OrganizationMember,
  NewOrganizationMember,
} from "./organizations";

export type {
  Service,
  NewService,
  Resource,
  NewResource,
  ResourceSchedule,
  NewResourceSchedule,
} from "./services";

export type {
  Customer,
  NewCustomer,
} from "./customers";

export type {
  Reservation,
  NewReservation,
} from "./reservations";

export type {
  CustomCollection,
  NewCustomCollection,
  CustomField,
  NewCustomField,
  CustomRecord,
  NewCustomRecord,
} from "./custom-data";
