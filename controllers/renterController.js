import Cycle from '../models/Cycle.js';
import Rental from '../models/Rental.js';
import User from '../models/User.js';

// Get renter's dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get completed rentals
    const completedRentals = await Rental.find({
      renter: userId,
      status: 'completed',
    });

    // Calculate stats
    const totalRides = completedRentals.length;
    const totalSpent = completedRentals.reduce(
      (sum, rental) => sum + rental.totalCost,
      0
    );

    res.json({
      totalRides,
      totalSpent,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching dashboard stats',
      error: error.message,
    });
  }
};

// Get active rentals
export const getActiveRentals = async (req, res) => {
  try {
    const userId = req.user.uid;

    const rentals = await Rental.find({
      renter: userId,
      status: 'active',
    })
      .populate('cycle')
      .sort({ startTime: -1 });

    const formattedRentals = rentals.map((rental) => ({
      _id: rental._id,
      id: rental._id,
      cycle: {
        _id: rental.cycle._id,
        brand: rental.cycle.brand,
        model: rental.cycle.model,
        location: rental.cycle.location,
        hourlyRate: rental.cycle.hourlyRate,
      },
      model: `${rental.cycle.brand} ${rental.cycle.model}`,
      startTime: rental.startTime,
      duration: rental.duration || 0,
      cost: rental.totalCost || 0,
      location: rental.cycle.location,
      hourlyRate: rental.hourlyRate,
    }));

    res.json({ rentals: formattedRentals });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching active rentals',
      error: error.message,
    });
  }
};

// Get recent rides
export const getRecentRides = async (req, res) => {
  try {
    const userId = req.user.uid;

    const rides = await Rental.find({
      renter: userId,
      status: 'completed',
    })
      .populate('cycle')
      .sort({ endTime: -1 })
      .limit(5);

    const formattedRides = rides.map((ride) => ({
      id: ride.cycle._id,
      model: `${ride.cycle.brand} ${ride.cycle.model}`,
      date: ride.endTime,
      duration: ride.duration,
      cost: ride.totalCost,
      location: ride.cycle.location,
    }));

    res.json({ rides: formattedRides });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching recent rides',
      error: error.message,
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
        error: 'CYCLE_NOT_FOUND',
      });
    }

    // Check if cycle is available
    if (cycle.isRented) {
      return res.status(400).json({
        message: 'Cycle is already rented',
        error: 'CYCLE_UNAVAILABLE',
      });
    }

    // Calculate rental duration and cost
    const duration =
      (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60); // in hours
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
      status: 'active',
    });

    // Update cycle status
    cycle.isRented = true;
    await cycle.save();

    // Save rental
    await rental.save();

    res.status(201).json({
      message: 'Rental created successfully',
      rental,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating rental',
      error: error.message,
    });
  }
};

// Cancel rental
export const cancelRental = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const userId = req.user.uid;

    // Find the rental
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    // Check if the user is authorized to cancel the rental
    if (rental.renter !== userId) {
      return res.status(403).json({
        message: 'Not authorized to cancel this rental',
        error: 'FORBIDDEN',
      });
    }

    // Check if the rental is still active
    if (rental.status !== 'active') {
      return res.status(400).json({
        message: 'Cannot cancel a rental that is not active',
        error: 'INVALID_STATUS',
      });
    }

    // Update rental status and cycle availability
    rental.status = 'cancelled';
    const cycle = await Cycle.findById(rental.cycle);
    if (cycle) {
      cycle.isRented = false;
      await cycle.save();
    }

    await rental.save();

    res.json({
      message: 'Rental cancelled successfully',
      rental,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error cancelling rental',
      error: error.message,
    });
  }
};

// Get renter profile
export const getRenterProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await User.findOne({ firebaseId: userId });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

// Rate a cycle
export const rateCycle = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.uid;

    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    if (rental.renter !== userId) {
      return res.status(403).json({
        message: 'Not authorized to rate this rental',
        error: 'FORBIDDEN',
      });
    }

    if (rental.status !== 'completed') {
      return res.status(400).json({
        message: 'Can only rate completed rentals',
        error: 'INVALID_STATUS',
      });
    }

    rental.rating = rating;
    rental.review = review;
    await rental.save();

    res.json({
      message: 'Rating submitted successfully',
      rental,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error submitting rating',
      error: error.message,
    });
  }
};

// Search for cycles
export const searchCycles = async (req, res) => {
  try {
    const { location, priceMin, priceMax, condition } = req.query;

    const query = {
      isActive: true,
      isRented: false,
    };

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (priceMin || priceMax) {
      query.hourlyRate = {};
      if (priceMin) query.hourlyRate.$gte = Number(priceMin);
      if (priceMax) query.hourlyRate.$lte = Number(priceMax);
    }

    if (condition) {
      query.condition = condition;
    }

    const cycles = await Cycle.find(query);
    res.json({ cycles });
  } catch (error) {
    res.status(500).json({
      message: 'Error searching cycles',
      error: error.message,
    });
  }
};

// Get nearby cycles
export const getNearbyCycles = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in kilometers, default 5km

    const cycles = await Cycle.find({
      isActive: true,
      isRented: false,
      // Add location-based query when you implement geospatial indexing
    });

    res.json({ cycles });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching nearby cycles',
      error: error.message,
    });
  }
};

export const completeRental = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const userId = req.user.uid;

    // Find the rental
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    // Check if the user is authorized to complete the rental
    if (rental.renter !== userId) {
      return res.status(403).json({
        message: 'Not authorized to complete this rental',
        error: 'FORBIDDEN',
      });
    }

    // Check if the rental is still active
    if (rental.status !== 'active') {
      return res.status(400).json({
        message: 'Cannot complete a rental that is not active',
        error: 'INVALID_STATUS',
      });
    }

    // Calculate duration and cost
    const endTime = new Date();
    const duration = Math.ceil((endTime - rental.startTime) / (1000 * 60)); // Duration in minutes
    const hours = Math.ceil(duration / 60); // Round up to the nearest hour
    const totalCost = hours * rental.hourlyRate;

    // Update rental status
    rental.status = 'completed';
    rental.endTime = endTime;
    rental.duration = duration;
    rental.totalCost = totalCost;
    await rental.save();

    // Update cycle status
    const cycle = await Cycle.findById(rental.cycle);
    if (cycle) {
      cycle.isRented = false;
      cycle.currentRenter = null;
      await cycle.save();
    }

    res.json({
      message: 'Rental completed successfully',
      rental: {
        _id: rental._id,
        cycle: rental.cycle,
        startTime: rental.startTime,
        endTime: rental.endTime,
        duration: rental.duration,
        totalCost: rental.totalCost,
        status: rental.status,
      },
    });
  } catch (error) {
    console.error('Error completing rental:', error);
    res.status(500).json({
      message: 'Error completing rental',
      error: error.message,
    });
  }
};
// Get rental history
export const getRentalHistory = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Find all rentals for the user
    const rentals = await Rental.find({ renter: userId })
      .populate('cycle') // Populate cycle details
      .sort({ createdAt: -1 });

    // Format the rental history data
    const formattedRentals = rentals.map((rental) => ({
      _id: rental._id,
      cycleModel: `${rental.cycle.brand} ${rental.cycle.model}`,
      duration: rental.duration,
      totalCost: rental.totalCost,
      status: rental.status,
      startTime: rental.startTime,
      endTime: rental.endTime,
      rating: rental.rating || null,
      review: rental.review || null,
      location: rental.cycle.location,
    }));

    res.json({ rentals: formattedRentals });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching rental history',
      error: error.message,
    });
  }
};
