/**
 * File: server.ts
 *
 * Description: Express server entry point. Configures middleware stack
 * (helmet, CORS, rate-limiting, compression, logging), mounts API routes,
 * exposes health check endpoints for the load balancer, and wires graceful
 * shutdown for the platform's SIGTERM during deploys.
 *
 * Author: Navnit(Ninjacode911)
 */

import 'dotenv/config'; // ⚠️ MUST be first — loads .env before any other imports read process.env
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.middleware';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import routes from './routes';

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);

const app = express();

// Trust the platform's reverse proxy so req.ip and rate limiting see the
// real client IP, not the load balancer's. Required on Fly.io / Render / Heroku.
app.set('trust proxy', 1);

app.use(helmet());

// CORS — strict allow-list in production, permissive in dev.
// In production, set ALLOWED_ORIGINS=https://admin.example.com,https://www.example.com
// React Native mobile clients don't send Origin headers so they bypass this entirely.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: IS_PRODUCTION
      ? allowedOrigins.length > 0
        ? allowedOrigins
        : false
      : '*',
    credentials: false,
  }),
);

app.use(compression());

// Skip access logging in production — Fly.io / Render capture stdout natively
// and `combined` format duplicates that with extra noise.
if (!IS_PRODUCTION) {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '1mb' }));
app.use(rateLimiter);

// Health checks — exposed at both /health (platform default) and /api/health
// (kept for backwards compatibility with mobile clients that may probe it).
const healthHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    env: NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api', routes);
app.use(errorHandler);

import { startYoutubeSyncJob } from './services/youtube.service';

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[Server] Listening on :${PORT} (env=${NODE_ENV})`);
  startYoutubeSyncJob();
});

// Graceful shutdown — Fly.io sends SIGTERM, then waits for the process to
// drain in-flight requests before SIGKILL. Without this handler, deploys
// can drop connections mid-request.
const shutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`[Server] ${signal} received, draining...`);
  server.close((err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('[Server] Error during shutdown:', err);
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log('[Server] Closed cleanly.');
    process.exit(0);
  });
  // Hard kill after 25s so we don't hang past Fly's 30s grace window.
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('[Server] Drain timed out, forcing exit.');
    process.exit(1);
  }, 25_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
