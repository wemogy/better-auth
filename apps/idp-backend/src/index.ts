import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import logger from './lib/logger/logger.js';
import { swaggerUI } from '@hono/swagger-ui';
import { CosmosFactory, initializeCosmosFromEnv } from './lib/cosmos/index.ts';
import tenantRoutes from './routes/tenantRoutes.js';

config();

// Initialize Cosmos DB
initializeCosmosFromEnv();

const app = new Hono();

// Add custom logger middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  logger.http(`${c.req.method} ${c.req.path} - ${c.res.status} - ${ms}ms`);
});

// Health check endpoint
app.get('/healthz', async c => {
  try {
    const cosmosFactory = CosmosFactory.isInitialized();
    const cosmosConfig = CosmosFactory.getConfig();

    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'idp-backend',
      version: '1.0.0',
      checks: {
        cosmos: {
          status: cosmosFactory ? 'healthy' : 'unhealthy',
          initialized: cosmosFactory,
          config: cosmosConfig
            ? {
                databaseId: cosmosConfig.databaseId,
                hasEndpoint: !!cosmosConfig.endpoint,
                hasDefaultContainer: !!cosmosConfig.defaultContainerId,
              }
            : null,
        },
      },
    };

    // Test Cosmos DB connectivity if initialized
    if (cosmosFactory && cosmosConfig) {
      try {
        const client = CosmosFactory.getInstance();
        await client.getDatabase().read();
        health.checks.cosmos.status = 'healthy';
        health.checks.cosmos.connectivity = 'connected';
      } catch (error) {
        health.checks.cosmos.status = 'unhealthy';
        health.checks.cosmos.connectivity = 'disconnected';
        health.checks.cosmos.error = error instanceof Error ? error.message : 'Unknown error';
        health.status = 'degraded';
      }
    } else {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return c.json(health, statusCode);
  } catch (error) {
    const unhealthyHealth = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'idp-backend',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return c.json(unhealthyHealth, 503);
  }
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
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Tenants',
        description: 'Tenant management endpoints',
      },
    ],
    paths: {
      '/healthz': {
        get: {
          summary: 'Health check',
          description: 'Check the health status of the service and its dependencies',
          tags: ['Health'],
          responses: {
            200: { description: 'Service healthy' },
            503: { description: 'Service unhealthy or degraded' },
          },
        },
      },
      '/tenants': {
        get: {
          summary: 'List tenants',
          tags: ['Tenants'],
          responses: { 200: { description: 'Success' } },
        },
        post: {
          summary: 'Create tenant',
          tags: ['Tenants'],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/tenants/{id}': {
        get: {
          summary: 'Get tenant by ID',
          tags: ['Tenants'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' } },
        },
        put: {
          summary: 'Update tenant',
          tags: ['Tenants'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
          responses: { 200: { description: 'Success' } },
        },
        delete: {
          summary: 'Delete tenant',
          tags: ['Tenants'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
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
    port: Number(process.env.PORT) || 3002,
  },
  info => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  },
);
