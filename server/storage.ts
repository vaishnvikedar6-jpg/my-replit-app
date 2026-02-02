import { users, grievances, grievanceLogs, type User, type InsertUser, type Grievance, type InsertGrievance, type GrievanceLog, type InsertGrievanceLog } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Grievances
  createGrievance(grievance: InsertGrievance): Promise<Grievance>;
  getGrievance(id: number): Promise<Grievance | undefined>;
  getGrievances(filter?: { userId?: number; status?: string; category?: string }): Promise<Grievance[]>;
  updateGrievance(id: number, updates: Partial<Grievance>): Promise<Grievance | undefined>;

  // Logs
  createGrievanceLog(log: InsertGrievanceLog): Promise<GrievanceLog>;
  getGrievanceLogs(grievanceId: number): Promise<GrievanceLog[]>;

  // Stats
  getGrievanceStats(): Promise<{ total: number; resolved: number; pending: number; categoryStats: Record<string, number> }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createGrievance(grievance: InsertGrievance): Promise<Grievance> {
    const [newGrievance] = await db.insert(grievances).values(grievance).returning();
    return newGrievance;
  }

  async getGrievance(id: number): Promise<Grievance | undefined> {
    const [grievance] = await db.select().from(grievances).where(eq(grievances.id, id));
    return grievance;
  }

  async getGrievances(filter?: { userId?: number; status?: string; category?: string }): Promise<Grievance[]> {
    const conditions = [];
    if (filter?.userId) conditions.push(eq(grievances.userId, filter.userId));
    if (filter?.status) conditions.push(eq(grievances.status, filter.status as any));
    if (filter?.category) conditions.push(eq(grievances.category, filter.category as any));

    return db
      .select()
      .from(grievances)
      .where(and(...conditions))
      .orderBy(desc(grievances.createdAt));
  }

  async updateGrievance(id: number, updates: Partial<Grievance>): Promise<Grievance | undefined> {
    const [updated] = await db
      .update(grievances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(grievances.id, id))
      .returning();
    return updated;
  }

  async createGrievanceLog(log: InsertGrievanceLog): Promise<GrievanceLog> {
    const [newLog] = await db.insert(grievanceLogs).values(log).returning();
    return newLog;
  }

  async getGrievanceLogs(grievanceId: number): Promise<GrievanceLog[]> {
    return db
      .select()
      .from(grievanceLogs)
      .where(eq(grievanceLogs.grievanceId, grievanceId))
      .orderBy(desc(grievanceLogs.createdAt));
  }

  async getGrievanceStats() {
    const allGrievances = await db.select().from(grievances);
    const total = allGrievances.length;
    const resolved = allGrievances.filter((g) => g.status === "resolved").length;
    const pending = allGrievances.filter((g) => g.status === "pending").length;

    const categoryStats: Record<string, number> = {};
    allGrievances.forEach((g) => {
      categoryStats[g.category] = (categoryStats[g.category] || 0) + 1;
    });

    return { total, resolved, pending, categoryStats };
  }
}

export const storage = new DatabaseStorage();
