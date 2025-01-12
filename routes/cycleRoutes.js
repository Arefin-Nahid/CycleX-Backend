import { Router } from 'express';
import Cycle from '../models/Cycle.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Get all cycles
router.get('/', async (req, res) => {
  try {
    const cycles = await Cycle.find({ isRented: false });
    res.json({ cycles });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching cycles',
      error: error.message
    });
  }
});

// Get cycle by ID
router.get('/:id', async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND'
      });
    }
    res.json({ cycle });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching cycle',
      error: error.message
    });
  }
});

// Search cycles
router.get('/search', async (req, res) => {
  try {
    const { location, priceMin, priceMax } = req.query;
    
    const query = { isRented: false };
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (priceMin || priceMax) {
      query.hourlyRate = {};
      if (priceMin) query.hourlyRate.$gte = Number(priceMin);
      if (priceMax) query.hourlyRate.$lte = Number(priceMax);
    }

    const cycles = await Cycle.find(query);
    res.json({ cycles });
  } catch (error) {
    res.status(500).json({
      message: 'Error searching cycles',
      error: error.message
    });
  }
});

// Protected routes
router.use(authMiddleware);

// Update cycle
router.patch('/:id', async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    
    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND'
      });
    }

    // Check ownership
    if (cycle.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to update this cycle',
        error: 'FORBIDDEN'
      });
    }

    // Update fields
    Object.assign(cycle, req.body);
    await cycle.save();

    res.json({
      message: 'Cycle updated successfully',
      cycle
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating cycle',
      error: error.message
    });
  }
});

// Delete cycle
router.delete('/:id', async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    
    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND'
      });
    }

    // Check ownership
    if (cycle.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to delete this cycle',
        error: 'FORBIDDEN'
      });
    }

    await cycle.remove();
    
    res.json({
      message: 'Cycle deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting cycle',
      error: error.message
    });
  }
});

export default router; 