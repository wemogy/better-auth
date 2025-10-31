import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createAuth } from './lib/auth.js';
const app = new Hono();
// Initialize auth
const authPromise = createAuth();
app.get('/', c => {
  return c.text('Hello Hono!');
});
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
