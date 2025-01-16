import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getNearbyCycles,
  getCycleById,
  searchCycles,
  updateCycle,
  deleteCycle,
  getAllCycles,
} from '../controllers/cycleController.js';

const router = Router();

// Public routes
router.get('/', getAllCycles); // Get all available cycles
router.get('/search', searchCycles); // Search for cycles by query
router.get('/nearby', getNearbyCycles); // Get nearby cycles
router.get('/:id', getCycleById); // Get cycle by ID

// Protected routes (require authentication)
router.use(authMiddleware);

router.patch('/:id', updateCycle); // Update cycle details
router.delete('/:id', deleteCycle); // Delete cycle

export default router;
