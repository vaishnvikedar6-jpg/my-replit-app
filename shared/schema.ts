import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["student", "staff", "admin"]);
export const grievanceStatusEnum = pgEnum("grievance_status", ["pending", "under_review", "resolved", "rejected"]);
export const grievancePriorityEnum = pgEnum("grievance_priority", ["normal", "urgent"]);
export const grievanceCategoryEnum = pgEnum("grievance_category", ["Academics", "Hostel", "Library", "Harassment", "Facilities", "Other"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").default("student").notNull(),
  department: text("department"), // For staff/admin
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grievances = pgTable("grievances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Nullable for completely anonymous if needed, or linked but hidden
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: grievanceCategoryEnum("category").notNull(),
  status: grievanceStatusEnum("status").default("pending").notNull(),
  priority: grievancePriorityEnum("priority").default("normal").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  isFlagged: boolean("is_flagged").default(false).notNull(), // AI Flagged
  flagReason: text("flag_reason"),
  files: jsonb("files").$type<string[]>(), // Array of file URLs/paths
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const grievanceLogs = pgTable("grievance_logs", {
  id: serial("id").primaryKey(),
  grievanceId: integer("grievance_id").notNull().references(() => grievances.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'status_change', 'comment', 'escalation'
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertGrievanceSchema = createInsertSchema(grievances).omit({ id: true, userId: true, createdAt: true, updatedAt: true, isFlagged: true, flagReason: true, status: true });
export const insertGrievanceLogSchema = createInsertSchema(grievanceLogs).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Grievance = typeof grievances.$inferSelect;
export type InsertGrievance = z.infer<typeof insertGrievanceSchema>;
export type GrievanceLog = typeof grievanceLogs.$inferSelect;
export type InsertGrievanceLog = z.infer<typeof insertGrievanceLogSchema>;

// API Types
export type LoginRequest = { username: string; password: string };
export type RegisterRequest = InsertUser;
export type UpdateGrievanceRequest = Partial<Omit<Grievance, "id" | "userId" | "createdAt">>;
