import { z } from 'zod';

// Schema for creating a new tenant (POST /tenants)
export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

// Schema for updating a tenant (PUT /tenants/:id)
export const updateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
});

// Schema for tenant response (includes generated fields)
export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  version: z.number().optional(),
});

// Schema for tenant list response
export const tenantListSchema = z.object({
  items: z.array(tenantSchema),
  continuationToken: z.string().optional(),
  count: z.number(),
});
