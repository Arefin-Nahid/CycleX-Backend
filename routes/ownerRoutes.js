import { Router } from 'express';
import { 
  getDashboardStats, 
  addCycle, 
  getMyCycles, 
  getRecentActivities, 
  toggleCycleStatus,
  updateCycle,
  deleteCycle,
  getOwnerProfile,
  getRentalHistory
} from '../controllers/ownerController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All routes should use authMiddleware
router.use(authMiddleware);

// Dashboard & Profile
router.get('/dashboard', getDashboardStats);
router.get('/profile', getOwnerProfile);

// Cycle Management
router.post('/cycles', addCycle);
router.get('/cycles', getMyCycles);
router.patch('/cycles/:cycleId', updateCycle);
router.delete('/cycles/:cycleId', deleteCycle);
router.patch('/cycles/:cycleId/toggle-status', toggleCycleStatus);

// Activities & History
router.get('/activities', getRecentActivities);
router.get('/rental-history', getRentalHistory);

export default router; 