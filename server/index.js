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

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    
    // Auto-seed demo data if database is fresh/empty
    const { default: User } = await import('./models/User.js');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Automatically initializing rich demo seed data...');
      const { seedDatabase } = await import('./scripts/seed.js');
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 FoodRescue Server running on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
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
