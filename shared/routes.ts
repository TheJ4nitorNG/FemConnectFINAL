import { z } from 'zod';
import { insertUserSchema, users } from './schema';
export { ROLES, REGIONS, LOCATIONS, SUBREGIONS } from "./schema";

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
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      input: z.object({
        role: z.string().optional(),
        region: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    toggleShadowBan: {
      method: 'PATCH' as const,
      path: '/api/users/:id/shadow-ban',
      input: z.object({ isShadowBanned: z.boolean() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: z.object({ message: z.string() }),
      },
    },
    toggleFilter: {
      method: 'PATCH' as const,
      path: '/api/user/filter',
      input: z.object({ enabled: z.boolean() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
    report: {
      method: 'POST' as const,
      path: '/api/users/:id/report',
      input: z.object({ reason: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
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
