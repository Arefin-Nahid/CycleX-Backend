import Cycle from '../models/Cycle.js';
import User from '../models/User.js';
import Rental from '../models/Rental.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get total cycles
    const totalCycles = await Cycle.countDocuments({ owner: userId });

    // Get active rentals
    const activeRentals = await Rental.countDocuments({
      owner: userId,
      status: 'active',
    });

    // Calculate total earnings
    const completedRentals = await Rental.find({
      owner: userId,
      status: 'completed',
    });
    const totalEarnings = completedRentals.reduce(
      (sum, rental) => sum + rental.totalCost,
      0
    );

    // Calculate average rating
    const ratedRentals = completedRentals.filter((rental) => rental.rating);
    const averageRating =
      ratedRentals.length > 0
        ? ratedRentals.reduce((sum, rental) => sum + rental.rating, 0) /
          ratedRentals.length
        : 0;

    res.json({
      totalCycles,
      activeRentals,
      totalEarnings,
      averageRating,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching dashboard stats',
      error: error.message,
    });
  }
};

//add new cycle
export const addCycle = async (req, res) => {
  try {
    const { brand, model, condition, hourlyRate, description, location, coordinates } = req.body;
    const owner = req.user.uid;

    if (!brand || !model || !hourlyRate || !description || !location) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'INVALID_INPUT',
      });
    }

    const cycle = new Cycle({
      owner,
      brand,
      model,
      condition: condition || 'Good',
      hourlyRate: parseFloat(hourlyRate),
      description,
      location,
      isActive: false,
      isRented: false,
      coordinates: coordinates || null, // Default to null if no coordinates provided
    });

    await cycle.save();

    res.status(201).json({
      message: 'Cycle added successfully',
      cycle,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error adding cycle',
      error: error.message,
    });
  }
};

// Get owner's cycles
export const getMyCycles = async (req, res) => {
  try {
    const userId = req.user.uid;
    const cycles = await Cycle.find({ owner: userId });
    res.json({ cycles });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching cycles',
      error: error.message,
    });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get recent rentals with more details
    const recentRentals = await Rental.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('cycle')
      .populate('renter', 'name');

    // Get recent cycle activities
    const recentCycles = await Cycle.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .limit(5);

    const activities = [];

    // Add rental activities
    recentRentals.forEach((rental) => {
      let activityType, title, description;
      
      switch (rental.status) {
        case 'active':
          activityType = 'rental_request';
          title = 'New Rental Started';
          description = `${rental.cycle.brand} ${rental.cycle.model} - ${rental.duration} hours`;
          break;
        case 'completed':
          if (rental.rating) {
            activityType = 'review';
            title = `${rental.rating}★ Review Received`;
            description = `${rental.cycle.brand} ${rental.cycle.model} - ${rental.review || 'No comment'}`;
          } else {
            activityType = 'payment';
            title = 'Rental Completed';
            description = `${rental.cycle.brand} ${rental.cycle.model} - ৳${rental.totalCost}`;
          }
          break;
        case 'cancelled':
          activityType = 'rental_cancelled';
          title = 'Rental Cancelled';
          description = `${rental.cycle.brand} ${rental.cycle.model}`;
          break;
        default:
          activityType = 'rental_update';
          title = 'Rental Updated';
          description = `${rental.cycle.brand} ${rental.cycle.model}`;
      }

      activities.push({
        type: activityType,
        title: title,
        description: description,
        time: rental.createdAt,
        rentalId: rental._id,
        cycleModel: `${rental.cycle.brand} ${rental.cycle.model}`,
        status: rental.status,
        amount: rental.totalCost,
        rating: rental.rating,
        duration: rental.duration,
      });
    });

    // Add cycle management activities
    recentCycles.forEach((cycle) => {
      if (cycle.updatedAt > cycle.createdAt) {
        activities.push({
          type: 'cycle_updated',
          title: 'Cycle Updated',
          description: `${cycle.brand} ${cycle.model} - ${cycle.isActive ? 'Activated' : 'Deactivated'}`,
          time: cycle.updatedAt,
          cycleId: cycle._id,
          cycleModel: `${cycle.brand} ${cycle.model}`,
          status: cycle.isActive ? 'active' : 'inactive',
        });
      } else {
        activities.push({
          type: 'cycle_added',
          title: 'New Cycle Added',
          description: `${cycle.brand} ${cycle.model} - ৳${cycle.hourlyRate}/hour`,
          time: cycle.createdAt,
          cycleId: cycle._id,
          cycleModel: `${cycle.brand} ${cycle.model}`,
          hourlyRate: cycle.hourlyRate,
        });
      }
    });

    // Sort all activities by time and take the most recent 8
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 8);

    res.json({ activities: recentActivities });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message,
    });
  }
};

// Toggle cycle status
export const toggleCycleStatus = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { coordinates } = req.body; // Receive coordinates from the frontend
    const userId = req.user.uid;

    const cycle = await Cycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND',
      });
    }

    if (cycle.owner !== userId) {
      return res.status(403).json({
        message: 'Not authorized',
        error: 'FORBIDDEN',
      });
    }

    cycle.isActive = !cycle.isActive; // Toggle the active status
    if (coordinates) {
      cycle.coordinates = coordinates; // Update the coordinates if provided
    }
    await cycle.save();

    res.json({
      message: `Cycle ${cycle.isActive ? 'activated' : 'deactivated'} successfully`,
      cycle,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error toggling cycle status',
      error: error.message,
    });
  }
};


// Get rental history
export const getRentalHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    const rentals = await Rental.find({ owner: userId })
      .populate('cycle')
      .populate('renter', 'name email phone')
      .sort({ createdAt: -1 });

    const formattedRentals = rentals.map((rental) => ({
      _id: rental._id,
      cycleModel: `${rental.cycle.brand} ${rental.cycle.model}`,
      cycleId: rental.cycle._id,
      duration: rental.duration,
      totalCost: rental.totalCost,
      status: rental.status,
      startTime: rental.startTime,
      endTime: rental.endTime,
      rating: rental.rating,
      review: rental.review,
      location: rental.cycle.location,
      coordinates: rental.cycle.coordinates,
      hourlyRate: rental.cycle.hourlyRate,
      condition: rental.cycle.condition,
      renter: rental.renter ? {
        name: rental.renter.name,
        email: rental.renter.email,
        phone: rental.renter.phone,
      } : null,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
      // Calculate earnings for completed rentals
      earnings: rental.status === 'completed' ? rental.totalCost : 0,
      // Calculate duration in hours for display
      durationHours: rental.duration || 0,
      // Add cycle details
      cycleDetails: {
        brand: rental.cycle.brand,
        model: rental.cycle.model,
        condition: rental.cycle.condition,
        hourlyRate: rental.cycle.hourlyRate,
        description: rental.cycle.description,
      }
    }));

    res.json({ rentals: formattedRentals });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching rental history',
      error: error.message,
    });
  }
};

// Update cycle
export const updateCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const updates = req.body;
    const userId = req.user.uid;

    const cycle = await Cycle.findById(cycleId);
    if (!cycle || cycle.owner !== userId) {
      return res.status(404).json({
        message: 'Cycle not found or unauthorized',
        error: 'NOT_FOUND',
      });
    }

    Object.assign(cycle, updates);
    await cycle.save();

    res.json({
      message: 'Cycle updated successfully',
      cycle,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating cycle',
      error: error.message,
    });
  }
};

// Delete cycle
export const deleteCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userId = req.user.uid;

    const cycle = await Cycle.findById(cycleId);
    if (!cycle || cycle.owner !== userId) {
      return res.status(404).json({
        message: 'Cycle not found or unauthorized',
        error: 'NOT_FOUND',
      });
    }

    if (cycle.isRented) {
      return res.status(400).json({
        message: 'Cannot delete rented cycle',
        error: 'CYCLE_RENTED',
      });
    }

    await cycle.deleteOne();

    res.json({
      message: 'Cycle deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting cycle',
      error: error.message,
    });
  }
};

// Get owner profile
export const getOwnerProfile = async (req, res) => {
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
