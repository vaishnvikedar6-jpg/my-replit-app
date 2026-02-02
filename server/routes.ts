import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import OpenAI from "openai";

const SessionStore = MemoryStore(session);

// Setup OpenAI for content filtering
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function checkContentForAbuse(text: string): Promise<{ isFlagged: boolean; reason?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: "You are a content moderator. Check the following text for foul, abusive, or hate language. Return a JSON object with { isFlagged: boolean, reason: string | null }.",
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return { isFlagged: !!result.isFlagged, reason: result.reason || null };
  } catch (err) {
    console.error("AI Moderation failed:", err);
    return { isFlagged: false }; // Fail open if AI fails, or handle differently
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session Setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({ checkPeriod: 86400000 }),
      cookie: { maxAge: 86400000 }, // 1 day
    })
  );

  // Auth Middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session.userId) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    next();
  };

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => res.sendStatus(200));
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) return res.status(400).json({ message: "Username already exists" });
      const user = await storage.createUser(input);
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  });

  // Grievance Routes
  app.get(api.grievances.list.path, isAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.session.userId);
    const filters: any = {};
    if (user?.role === "student") filters.userId = user.id;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;

    const grievances = await storage.getGrievances(filters);
    res.json(grievances);
  });

  app.get(api.grievances.get.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const grievance = await storage.getGrievance(id);
    if (!grievance) return res.status(404).json({ message: "Grievance not found" });

    // Check permission
    const user = await storage.getUser(req.session.userId);
    if (user?.role === "student" && grievance.userId !== user.id && !grievance.isAnonymous) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const logs = await storage.getGrievanceLogs(id);
    res.json({ ...grievance, logs });
  });

  app.post(api.grievances.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.grievances.create.input.parse(req.body);
      const user = await storage.getUser(req.session.userId);

      // AI Content Filtering
      const moderation = await checkContentForAbuse(`${input.title} ${input.description}`);
      
      const grievance = await storage.createGrievance({
        ...input,
        userId: user!.id,
        isFlagged: moderation.isFlagged,
        flagReason: moderation.reason,
        status: moderation.isFlagged ? "under_review" : "pending",
      });

      await storage.createGrievanceLog({
        grievanceId: grievance.id,
        userId: user!.id,
        action: "created",
        content: "Grievance submitted",
      });

      if (moderation.isFlagged) {
        await storage.createGrievanceLog({
          grievanceId: grievance.id,
          userId: user!.id, // System action ideally, but using user for now or null
          action: "auto_flagged",
          content: `Flagged by AI: ${moderation.reason}`,
        });
      }

      res.status(201).json(grievance);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.grievances.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, priority, comment } = req.body;
      const user = await storage.getUser(req.session.userId);

      if (user?.role === "student") {
        return res.status(403).json({ message: "Students cannot update status" });
      }

      const updates: any = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;

      const updated = await storage.updateGrievance(id, updates);
      if (!updated) return res.status(404).json({ message: "Grievance not found" });

      if (status || priority) {
        await storage.createGrievanceLog({
          grievanceId: id,
          userId: user!.id,
          action: "status_change",
          content: `Updated: ${status ? `Status to ${status}` : ""} ${priority ? `Priority to ${priority}` : ""}`,
        });
      }

      if (comment) {
        await storage.createGrievanceLog({
          grievanceId: id,
          userId: user!.id,
          action: "comment",
          content: comment,
        });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Admin Stats
  app.get(api.admin.stats.path, isAdmin, async (req, res) => {
    const stats = await storage.getGrievanceStats();
    res.json(stats);
  });

  // Seed Data
  async function seed() {
    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      await storage.createUser({
        username: "admin",
        password: "admin123",
        role: "admin",
        fullName: "System Administrator",
        email: "admin@university.edu",
        department: "Administration",
      });
      console.log("Admin user created");
    }

    const student = await storage.getUserByUsername("student");
    if (!student) {
      await storage.createUser({
        username: "student",
        password: "password123",
        role: "student",
        fullName: "John Doe",
        email: "john@student.edu",
      });
      console.log("Student user created");
    }
  }
  
  await seed();

  return httpServer;
}
