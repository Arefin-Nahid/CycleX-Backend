import { Router } from 'express';
import { getDashboardStats, createRental } from '../controllers/renterController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All routes should use authMiddleware
router.use(authMiddleware);

// Get dashboard statistics
router.get('/dashboard', getDashboardStats);

// Create a new rental
router.post('/rentals', createRental);

export default router; 