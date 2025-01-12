const Cycle = require('../models/Cycle');
const Rental = require('../models/Rental');

const ownerController = {
  // Get owner dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const ownerUID = req.user.uid;

      // Get total cycles
      const totalCycles = await Cycle.countDocuments({ ownerUID });

      // Get active rentals
      const activeRentals = await Rental.countDocuments({
        ownerUID,
        status: 'active'
      });

      // Get total earnings
      const totalEarnings = await Rental.aggregate([
        {
          $match: {
            ownerUID,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalCost' }
          }
        }
      ]);

      // Get average rating
      const ratingStats = await Rental.aggregate([
        {
          $match: {
            ownerUID,
            rating: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' }
          }
        }
      ]);

      // Get recent activities
      const recentActivities = await Rental.find({ ownerUID })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('cycleId');

      res.json({
        totalCycles,
        activeRentals,
        totalEarnings: totalEarnings[0]?.total || 0,
        averageRating: ratingStats[0]?.averageRating || 0,
        recentActivities
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Add a new cycle
  addCycle: async (req, res) => {
    try {
      const { model, description, hourlyRate, location, images } = req.body;
      const ownerUID = req.user.uid;

      const cycle = new Cycle({
        ownerUID,
        model,
        description,
        hourlyRate,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        images
      });

      await cycle.save();
      res.status(201).json(cycle);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get owner's cycles
  getMyCycles: async (req, res) => {
    try {
      const cycles = await Cycle.find({ ownerUID: req.user.uid });
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = ownerController; 