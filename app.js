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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/renter', renterRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/rentals', rentalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    error: 'NOT_FOUND'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: err.code || 'INTERNAL_ERROR'
  });
});

// Connect to MongoDB
connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app; 