import Cycle from '../models/Cycle.js';
import Rental from '../models/Rental.js';
import User from '../models/User.js';

// Get renter's dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.uid;
    const activeRentals = await Rental.countDocuments({ 
      renter: userId, 
      status: 'active' 
    });
    const completedRentals = await Rental.countDocuments({ 
      renter: userId, 
      status: 'completed' 
    });

    res.json({
      activeRentals,
      completedRentals
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Create a new rental
export const createRental = async (req, res) => {
  try {
    const { cycleId, startTime, endTime } = req.body;
    const renterId = req.user.uid;

    // Find the cycle
    const cycle = await Cycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND'
      });
    }

    // Check if cycle is available
    if (cycle.isRented) {
      return res.status(400).json({
        message: 'Cycle is already rented',
        error: 'CYCLE_UNAVAILABLE'
      });
    }

    // Calculate rental duration and cost
    const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60); // in hours
    const totalCost = duration * cycle.hourlyRate;

    // Create rental
    const rental = new Rental({
      cycle: cycleId,
      renter: renterId,
      owner: cycle.owner,
      startTime,
      endTime,
      duration,
      totalCost,
      status: 'active'
    });

    // Update cycle status
    cycle.isRented = true;
    await cycle.save();

    // Save rental
    await rental.save();

    res.status(201).json({
      message: 'Rental created successfully',
      rental
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating rental',
      error: error.message
    });
  }
}; 