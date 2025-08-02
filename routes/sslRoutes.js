import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createSSLSession,
  sslSuccess,
  sslFail,
  sslCancel,
  sslIPN,
  getSSLPaymentStatus,
  testSSLCommerz,
} from '../controllers/sslCommerzController.js';

const router = express.Router();

// SSLCommerz payment routes
router.post('/create-session', authMiddleware, createSSLSession);
router.get('/status/:transactionId', authMiddleware, getSSLPaymentStatus);
router.get('/test', testSSLCommerz); // Test endpoint (no auth required)

// SSLCommerz callback routes (no auth required as they are called by SSLCommerz)
router.post('/success', sslSuccess);
router.post('/fail', sslFail);
router.post('/cancel', sslCancel);
router.post('/ipn', sslIPN);

export default router; 