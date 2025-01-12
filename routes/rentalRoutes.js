const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const authMiddleware = require('../middleware/authMiddleware');

// Get user's rental history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const rentals = await Rental.find({ userId: req.user.uid })
      .sort({ startTime: -1 });
    
    // Calculate statistics
    const totalRides = rentals.length;
    const totalSpent = rentals.reduce((sum, rental) => sum + rental.totalCost, 0);
    
    res.json({
      rentals,
      stats: {
        totalRides,
        totalSpent
      }
    });
  } catch (error) {
    console.error('Error fetching rental history:', error);
    res.status(500).json({ message: 'Error fetching rental history', error: error.message });
  }
});

module.exports = router; 