import { Router } from 'express';
import { 
  getDashboardStats, 
  getActiveRentals, 
  getRecentRides,
  createRental,
  completeRental,
  cancelRental,
  getRenterProfile,
  getRentalHistory,
  rateCycle,
  searchCycles,
  getNearbyCycles,
  fixOrphanedCycles
} from '../controllers/renterController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All routes should use authMiddleware
router.use(authMiddleware);

// Dashboard & Profile
router.get('/dashboard', getDashboardStats);
router.get('/profile', getRenterProfile);

// Rental Management
router.get('/active-rentals', getActiveRentals);
router.get('/recent-rides', getRecentRides);
router.get('/rental-history', getRentalHistory);

// Rental Actions
router.post('/rentals', createRental);
router.post('/rentals/:rentalId/complete', completeRental);
router.post('/rentals/:rentalId/cancel', cancelRental);
router.post('/rentals/:rentalId/rate', rateCycle);

// Cycle Search
router.get('/cycles/search', searchCycles);
router.get('/cycles/nearby', getNearbyCycles);

// Utility endpoints (for debugging)
router.post('/fix-orphaned-cycles', fixOrphanedCycles);

export default router; 