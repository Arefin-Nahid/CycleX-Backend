import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  generateQRData,
  validateQRData,
  getQRStats,
} from '../controllers/qrController.js';

const router = Router();

// All QR routes require authentication
router.use(authMiddleware);

// Generate QR data for a specific cycle
router.get('/generate/:cycleId', generateQRData);

// Validate QR data (can be used before processing rental)
router.post('/validate', validateQRData);

// Get QR statistics for cycle owner
router.get('/stats', getQRStats);

export default router; 