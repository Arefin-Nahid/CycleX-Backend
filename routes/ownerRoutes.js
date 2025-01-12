import { Router } from 'express';
import { getDashboardStats, addCycle, getMyCycles } from '../controllers/ownerController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All routes should use authMiddleware
router.use(authMiddleware);

// Get dashboard statistics
router.get('/dashboard', getDashboardStats);

// Add a new cycle
router.post('/cycles', addCycle);

// Get owner's cycles
router.get('/cycles', getMyCycles);

export default router; 