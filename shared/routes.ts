import { z } from "zod";
import { insertUserSchema, insertGrievanceSchema, users, grievances, grievanceLogs } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: {
        200: z.void(),
      },
    },
    register: {
      method: "POST" as const,
      path: "/api/register",
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  grievances: {
    list: {
      method: "GET" as const,
      path: "/api/grievances",
      input: z.object({
        status: z.enum(["pending", "under_review", "resolved", "rejected"]).optional(),
        category: z.enum(["Academics", "Hostel", "Library", "Harassment", "Facilities", "Other"]).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof grievances.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/grievances/:id",
      responses: {
        200: z.custom<typeof grievances.$inferSelect & { logs: typeof grievanceLogs.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/grievances",
      input: insertGrievanceSchema,
      responses: {
        201: z.custom<typeof grievances.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/grievances/:id",
      input: z.object({
        status: z.enum(["pending", "under_review", "resolved", "rejected"]).optional(),
        priority: z.enum(["normal", "urgent"]).optional(),
        comment: z.string().optional(), // For logs
      }),
      responses: {
        200: z.custom<typeof grievances.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  admin: {
    stats: {
      method: "GET" as const,
      path: "/api/admin/stats",
      responses: {
        200: z.object({
          total: z.number(),
          resolved: z.number(),
          pending: z.number(),
          categoryStats: z.record(z.number()),
        }),
        403: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
