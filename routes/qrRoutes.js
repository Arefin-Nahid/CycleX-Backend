import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  generateQRData,
  validateQRData,
  getQRStats,
  getQRCode,
} from '../controllers/qrController.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Generate QR data for a specific cycle
router.get('/generate/:cycleId', generateQRData);

// Get simple QR code (just cycle ID)
router.get('/code/:cycleId', getQRCode);

// Validate QR data
router.post('/validate', validateQRData);

// Get QR statistics
router.get('/stats', getQRStats);

export default router; 