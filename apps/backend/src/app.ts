import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { auditMiddleware } from './middleware/audit';
import { swaggerSpec } from './swagger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import msmeRoutes from './modules/msmes/msmes.routes';
import bdspRoutes from './modules/bdsps/bdsps.routes';
import productRoutes from './modules/products/products.routes';
import opportunityRoutes from './modules/opportunities/opportunities.routes';
import verificationRoutes from './modules/verifications/verifications.routes';
import reportRoutes from './modules/reports/reports.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import importRoutes from './modules/imports/imports.routes';
import fileRoutes from './modules/files/files.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import auditRoutes from './modules/audit/audit.routes';
import settingsRoutes from './modules/settings/settings.routes';
import syncRoutes from './modules/sync/sync.routes';

export function createApp(): Application {
  const app = express();

  // Trust reverse proxy (Google Cloud Run load balancer)
  app.set('trust proxy', 1);

  // ── Ensure upload directory exists ──────────────────────────────────────
  const uploadDir = path.resolve(config.upload.dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // ── Security Headers ─────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }));

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts. Please try again later.' },
  });

  app.use(limiter);

  // ── Compression ──────────────────────────────────────────────────────────
  app.use(compression());

  // ── Body Parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Logging ────────────────────────────────────────────────────────────────
  if (config.env !== 'test') {
    app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
  }

  // ── Static Files (uploads) ────────────────────────────────────────────────
  app.use('/uploads', express.static(uploadDir));

  // ── Swagger Documentation ─────────────────────────────────────────────────
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #1e3a5f; }',
    customSiteTitle: 'SBA MSME Portal API Docs',
  }));

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SBA MSME Portal API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/msmes', msmeRoutes);
  app.use('/api/bdsps', bdspRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/opportunities', opportunityRoutes);
  app.use('/api/verifications', verificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/imports', importRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/sync', syncRoutes);

  // ── 404 Handler ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Error Handler ─────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
