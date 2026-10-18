import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, getDBConnectionStatus } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env regardless of root cwd
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Allowed origins configuration for CORS (supports production frontend and local dev)
const rawClientUrls = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean).flatMap(url => url.split(',').map(u => u.trim().replace(/\/+$/, '')));

const localOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];

const allowedOrigins = Array.from(new Set([...localOrigins, ...rawClientUrls]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (health checks, server-to-server, Postman, curl)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');

    // Allow explicitly defined origins
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Allow dynamic Vercel / Render deployment subdomains
    try {
      const parsed = new URL(origin);
      if (parsed.hostname.endsWith('.vercel.app') || parsed.hostname.endsWith('.onrender.com')) {
        return callback(null, true);
      }
    } catch {
      // Ignore URL parse failures
    }

    // In local development or if permissive mode requested, allow
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_ALL_CORS === 'true') {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBConnectionStatus();
  res.json({
    status: 'ok',
    project: 'FoodRescue - Smart Surplus Food Redistribution & Donation System',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to Database and Start Server
export const startServer = async () => {
  try {
    await connectDB();
    
    // Auto-seed demo data if database is fresh/empty (guarded against unintentional production overwrites)
    const { default: User } = await import('./models/User.js');
    const userCount = await User.countDocuments();
    if (userCount === 0 && (process.env.NODE_ENV !== 'production' || process.env.AUTO_SEED === 'true')) {
      console.log('🌱 Database is empty. Automatically initializing rich demo seed data...');
      const { seedDatabase } = await import('./scripts/seed.js');
      await seedDatabase();
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 FoodRescue Server running on http://${HOST}:${PORT}`);
      console.log(`📡 Health Check: http://${HOST}:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
