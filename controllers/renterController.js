const Cycle = require('../models/Cycle');
const Rental = require('../models/Rental');

const renterController = {
  // Get renter dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const renterUID = req.user.uid;

      // Get total rides
      const totalRides = await Rental.countDocuments({
        renterUID,
        status: 'completed'
      });

      // Get active rental
      const activeRental = await Rental.findOne({
        renterUID,
        status: 'active'
      }).populate('cycleId');

      // Get total spent
      const totalSpent = await Rental.aggregate([
        {
          $match: {
            renterUID,
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

      // Get recent rides
      const recentRides = await Rental.find({
        renterUID,
        status: 'completed'
      })
        .sort({ endTime: -1 })
        .limit(5)
        .populate('cycleId');

      res.json({
        totalRides,
        activeRental,
        totalSpent: totalSpent[0]?.total || 0,
        recentRides
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create new rental
  createRental: async (req, res) => {
    try {
      const { cycleId, startTime, duration } = req.body;
      const renterUID = req.user.uid;

      // Get cycle details
      const cycle = await Cycle.findById(cycleId);
      if (!cycle) {
        return res.status(404).json({ message: 'Cycle not found' });
      }

      if (cycle.status !== 'available') {
        return res.status(400).json({ message: 'Cycle is not available' });
      }

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + duration);

      const totalCost = cycle.hourlyRate * duration;

      const rental = new Rental({
        cycleId,
        renterUID,
        ownerUID: cycle.ownerUID,
        startTime,
        endTime,
        duration,
        totalCost
      });

      // Update cycle status
      cycle.status = 'rented';
      await cycle.save();

      await rental.save();
      res.status(201).json(rental);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = renterController; 