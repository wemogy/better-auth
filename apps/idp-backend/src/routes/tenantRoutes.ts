import { Hono } from 'hono';
import { TenantRepository } from '../lib/cosmos/index.js';
import { createTenantSchema, updateTenantSchema } from '../lib/schemas.js';

const tenantRoutes = new Hono();
let tenantRepo: TenantRepository | null = null;

async function getTenantRepo(): Promise<TenantRepository> {
  if (!tenantRepo) {
    tenantRepo = new TenantRepository();
    await tenantRepo.initialize();
  }
  return tenantRepo!;
}

// GET /tenants - Find all tenants
tenantRoutes.get('/', async c => {
  try {
    const repo = await getTenantRepo();
    const result = await repo.findAll();
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// GET /tenants/:id - Find tenant by ID
tenantRoutes.get('/:id', async c => {
  const id = c.req.param('id');
  try {
    const repo = await getTenantRepo();
    const tenant = await repo.findById(id);
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    return c.json(tenant);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// POST /tenants - Create a new tenant
tenantRoutes.post('/', async c => {
  try {
    const body = await c.req.json();
    const validatedData = createTenantSchema.parse(body);
    const repo = await getTenantRepo();
    const tenant = await repo.create(validatedData);
    return c.json(tenant, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// PUT /tenants/:id - Update a tenant
tenantRoutes.put('/:id', async c => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const validatedData = updateTenantSchema.parse(body);
    const repo = await getTenantRepo();
    const tenant = await repo.update(id, validatedData);
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    return c.json(tenant);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// DELETE /tenants/:id - Delete a tenant
tenantRoutes.delete('/:id', async c => {
  const id = c.req.param('id');
  try {
    const repo = await getTenantRepo();
    const success = await repo.deleteById(id);
    if (!success) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    return c.json({ message: 'Tenant deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default tenantRoutes;
