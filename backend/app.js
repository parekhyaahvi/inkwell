import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import commentRoutes from './routes/comments.js';
import tagRoutes from './routes/tags.js';
import bookmarkRoutes from './routes/bookmarks.js';

import { generalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

// Serve local uploads
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// 1. Helmet Security Headers (First middleware)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.skypack.dev"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "api.inkwell.app", "http://localhost:3000"]
    }
  }
}));

// 2. CORS Whitelisting
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptionsDelegate = (req, callback) => {
  const requestOrigin = req.header('Origin');
  const requestHost = req.header('Host');

  if (!requestOrigin) {
    callback(null, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400
    });
    return;
  }

  let isAllowed = allowedOrigins.includes(requestOrigin);

  if (!isAllowed && requestHost) {
    try {
      isAllowed = new URL(requestOrigin).host === requestHost;
    } catch {
      isAllowed = false;
    }
  }

  callback(null, {
    origin: isAllowed,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  });
};
app.use(cors(corsOptionsDelegate));

// 3. Body Parsing Limit
app.use(express.json({ limit: '2mb' }));

// 4. Cookies parsing
app.use(cookieParser(process.env.JWT_SECRET || 'fallback_secret_for_dev_mode_only_not_production_hardening_64_bytes'));

// 5. Global rate limiter (60 req/min)
app.use(generalRateLimiter);


// API Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/bookmarks', bookmarkRoutes);



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy', timestamp: new Date() });
});

// Fallback for API routes not found
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'NotFound', message: 'API resource not found' });
});

// 7. Global Async Error Boundary (Final middleware)
app.use(errorHandler);

export default app;
