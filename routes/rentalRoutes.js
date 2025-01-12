import { Router } from 'express';
import Rental from '../models/Rental.js';
import Cycle from '../models/Cycle.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All routes should use authMiddleware
router.use(authMiddleware);

// Get user's rentals
router.get('/my-rentals', async (req, res) => {
  try {
    const rentals = await Rental.find({ renter: req.user.uid })
      .populate('cycle')
      .sort({ createdAt: -1 });

    res.json({ rentals });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching rentals',
      error: error.message
    });
  }
});

// Get rental by ID
router.get('/:id', async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('cycle');
    
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND'
      });
    }

    // Check if user is authorized to view this rental
    if (rental.renter !== req.user.uid && rental.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to view this rental',
        error: 'FORBIDDEN'
      });
    }

    res.json({ rental });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching rental',
      error: error.message
    });
  }
});

// Complete rental
router.post('/:id/complete', async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND'
      });
    }

    // Check if user is the renter
    if (rental.renter !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to complete this rental',
        error: 'FORBIDDEN'
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        message: 'Rental is not active',
        error: 'INVALID_STATUS'
      });
    }

    // Update rental status
    rental.status = 'completed';
    
    // Add rating and review if provided
    if (req.body.rating) {
      rental.rating = req.body.rating;
    }
    if (req.body.review) {
      rental.review = req.body.review;
    }

    await rental.save();

    // Update cycle availability
    const cycle = await Cycle.findById(rental.cycle);
    if (cycle) {
      cycle.isRented = false;
      await cycle.save();
    }

    res.json({
      message: 'Rental completed successfully',
      rental
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error completing rental',
      error: error.message
    });
  }
});

// Cancel rental
router.post('/:id/cancel', async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND'
      });
    }

    // Check if user is the renter or owner
    if (rental.renter !== req.user.uid && rental.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to cancel this rental',
        error: 'FORBIDDEN'
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        message: 'Rental is not active',
        error: 'INVALID_STATUS'
      });
    }

    // Update rental status
    rental.status = 'cancelled';
    await rental.save();

    // Update cycle availability
    const cycle = await Cycle.findById(rental.cycle);
    if (cycle) {
      cycle.isRented = false;
      await cycle.save();
    }

    res.json({
      message: 'Rental cancelled successfully',
      rental
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error cancelling rental',
      error: error.message
    });
  }
});

export default router; 