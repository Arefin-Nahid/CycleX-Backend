import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import userRoutes from './routes/userRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import renterRoutes from './routes/renterRoutes.js';
import cycleRoutes from './routes/cycleRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import sslRoutes from './routes/sslRoutes.js';
import paymentTimeoutRoutes from './routes/paymentTimeoutRoutes.js';

// Import Firebase admin
import './config/firebase.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(json());

// Static file serving with error handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from public directory with error handling
app.use('/public', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', req.path);
  
  // Check if file exists
  import('fs').then(fs => {
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      // Return a simple HTML response if file doesn't exist
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Page Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; }
            .error { color: #f44336; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">⚠ Page Not Found</div>
            <p>The requested page could not be found.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </div>
        </body>
        </html>
      `);
    }
  }).catch(err => {
    console.error('Error serving static file:', err);
    res.status(500).send('Internal Server Error');
  });
});

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

// Routes
app.use('/api/users', userRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/renter', renterRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/payments/ssl', sslRoutes);
app.use('/api/payment-timeouts', paymentTimeoutRoutes);

// 404 handler
app.use((req, res) => {
  // Check if this is an API request
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      message: 'Route not found',
      error: 'NOT_FOUND',
    });
  } else {
    // For non-API requests (like WebView requests), return a simple HTML page
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Page Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p><a href="javascript:history.back()">Go Back</a></p>
          </div>
        </body>
      </html>
    `);
  }
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
