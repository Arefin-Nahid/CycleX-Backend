import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './routes/userRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import renterRoutes from './routes/renterRoutes.js';
import cycleRoutes from './routes/cycleRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';

// Import Firebase admin
import './config/firebase.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(json());

// Vercel check route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Welcome to CycleX API!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    contact: { email: 'nahid7ar@gmail.com', phone: '+880-1727-892717' },
  });
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    const dbStatus = (await connect.connection).readyState === 1 ? 'Connected' : 'Disconnected';
    res.status(200).json({
      status: 'OK',
      database: dbStatus,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: err.message,
    });
  }
});

// API Version Prefix
const API_PREFIX = '/api/v1';

// Routes
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/owner`, ownerRoutes);
app.use(`${API_PREFIX}/renter`, renterRoutes);
app.use(`${API_PREFIX}/cycles`, cycleRoutes);
app.use(`${API_PREFIX}/rentals`, rentalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    error: 'NOT_FOUND',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: err.code || 'INTERNAL_ERROR',
  });
});

// Connect to MongoDB
connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing MongoDB connection...');
  await connect.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  await connect.connection.close();
  process.exit(0);
});

export default app;
