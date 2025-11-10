import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createAuth } from './lib/auth.js';
import { cors } from 'hono/cors';

const app = new Hono();

// Initialize auth
const authPromise = createAuth();

app.get('/', c => {
  return c.text('Hello Hono!');
});

app.use(
  '/api/auth/*', // or replace with "*" to enable cors for all routes
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', '*'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'Set-Cookie'],
    maxAge: 600,
    credentials: true,
  }),
);

// Auth routes
app.all('/api/auth/*', async c => {
  const auth = await authPromise;
  return auth.handler(c.req.raw);
});

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  info => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
