import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getUnpaidRentals,
  forcePaymentTimeout,
  retryPayment,
  getPaymentTimeoutStats,
} from '../controllers/paymentTimeoutController.js';

const router = express.Router();

// Admin routes (require authentication)
router.get('/unpaid-rentals', authMiddleware, getUnpaidRentals);
router.get('/stats', authMiddleware, getPaymentTimeoutStats);
router.post('/force-timeout/:rentalId', authMiddleware, forcePaymentTimeout);

// User routes
router.post('/retry/:rentalId', authMiddleware, retryPayment);

export default router; 