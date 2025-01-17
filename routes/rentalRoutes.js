import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getMyRentals,
  getRentalById,
  completeRental,
  cancelRental,
  rentCycle, // Import rentCycle function
} from '../controllers/rentalController.js';

const router = Router();

// All routes should use authMiddleware
router.use(authMiddleware);

// Rental routes
router.get('/my-rentals', getMyRentals); // Get user's rentals
router.get('/:id', getRentalById); // Get rental by ID
router.post('/:id/complete', completeRental); // Complete a rental
router.post('/:id/cancel', cancelRental); // Cancel a rental
router.post('/', rentCycle); // Route for renting a cycle

export default router;
