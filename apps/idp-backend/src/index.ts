import { config } from 'dotenv';
config();
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import logger from './lib/logger/logger.js';
import { swaggerUI } from '@hono/swagger-ui';
import { initializeCosmosFromEnv } from './lib/cosmos/cosmosFactory.js';

// Initialize Cosmos DB
initializeCosmosFromEnv();

import tenantRoutes from './routes/tenantRoutes.js';

const app = new Hono();

// Add custom logger middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  logger.http(`${c.req.method} ${c.req.path} - ${c.res.status} - ${ms}ms`);
});

// Mount tenant routes
app.route('/tenants', tenantRoutes);

// Swagger UI
app.get('/ui', swaggerUI({ url: '/doc' }));

// Basic OpenAPI spec
app.get('/doc', c => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Tenant API',
      version: '1.0.0',
      description: 'API for managing tenants',
    },
    paths: {
      '/tenants': {
        get: {
          summary: 'List tenants',
          responses: { 200: { description: 'Success' } },
        },
        post: {
          summary: 'Create tenant',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/tenants/{id}': {
        get: {
          summary: 'Get tenant by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } },
        },
        put: {
          summary: 'Update tenant',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
          responses: { 200: { description: 'Success' } },
        },
        delete: {
          summary: 'Delete tenant',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/tenants/name/{name}': {
        get: {
          summary: 'Get tenant by name',
          parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } },
        },
      },
    },
    components: {
      schemas: {
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  });
});

app.get('/', c => {
  return c.text('API Running');
});

serve(
  {
    fetch: app.fetch,
    port: 3002,
  },
  info => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  },
);
