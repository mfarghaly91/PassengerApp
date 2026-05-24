import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { driversTable } from "./drivers";
import { tripsTable } from "./trips";

export const documentTypeEnum = pgEnum("document_type", [
  "national_id_front",
  "national_id_back",
  "driving_license_front",
  "driving_license_back",
  "vehicle_license_front",
  "vehicle_license_back",
  "vehicle_photo",
  "profile_photo",
  "trip_selfie",
]);

export const docVerificationStatusEnum = pgEnum("doc_verification_status", [
  "pending",
  "approved",
  "rejected",
]);

export const driverDocumentsTable = pgTable("driver_documents", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => driversTable.id, { onDelete: "cascade" }),
  tripId: integer("trip_id").references(() => tripsTable.id, { onDelete: "set null" }),
  type: documentTypeEnum("type").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type").default("image/jpeg"),
  verificationStatus: docVerificationStatusEnum("verification_status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DriverDocument = typeof driverDocumentsTable.$inferSelect;
