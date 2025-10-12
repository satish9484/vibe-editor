import { Hono } from 'hono';

const app = new Hono();

app.get('/', c => {
  return c.json({
    message: 'Welcome to Hono.js!',
    status: 'Server is running successfully',
  });
});

app.get('/api/health', c => {
  return c.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    framework: 'Hono',
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
