import Rental from '../models/Rental.js';
import Cycle from '../models/Cycle.js';

// Get user's rentals
export const getMyRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ renter: req.user.uid })
      .populate('cycle')
      .sort({ createdAt: -1 });

    res.json({ rentals });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching rentals',
      error: error.message,
    });
  }
};

// Get rental by ID
export const getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('cycle');

    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    // Check if user is authorized to view this rental
    if (rental.renter !== req.user.uid && rental.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to view this rental',
        error: 'FORBIDDEN',
      });
    }

    res.json({ rental });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching rental',
      error: error.message,
    });
  }
};

export const rentCycle = async (req, res) => {
  try {
    const { cycleId } = req.body;
    const userId = req.user.uid;

    // Validate input
    if (!cycleId) {
      return res.status(400).json({
        message: 'Cycle ID is required',
        error: 'MISSING_CYCLE_ID',
      });
    }

    // Validate ObjectId format
    if (cycleId.length !== 24) {
      return res.status(400).json({
        message: 'Invalid cycle ID format',
        error: 'INVALID_ID_FORMAT',
      });
    }

    // Find the cycle
    const cycle = await Cycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({ 
        message: 'Cycle not found', 
        error: 'CYCLE_NOT_FOUND' 
      });
    }

    // Ensure the cycle is available for rent
    if (cycle.isRented) {
      return res.status(400).json({ 
        message: 'Cycle is already rented', 
        error: 'CYCLE_UNAVAILABLE',
        cycle: {
          _id: cycle._id,
          brand: cycle.brand,
          model: cycle.model,
          condition: cycle.condition,
          hourlyRate: cycle.hourlyRate,
          location: cycle.location,
          isRented: cycle.isRented,
          isActive: cycle.isActive,
        }
      });
    }

    // Check if cycle is active
    if (!cycle.isActive) {
      return res.status(400).json({ 
        message: 'Cycle is not available for rent', 
        error: 'CYCLE_INACTIVE',
        cycle: {
          _id: cycle._id,
          brand: cycle.brand,
          model: cycle.model,
          condition: cycle.condition,
          hourlyRate: cycle.hourlyRate,
          location: cycle.location,
          isRented: cycle.isRented,
          isActive: cycle.isActive,
        }
      });
    }

    // Check if user is trying to rent their own cycle
    if (cycle.owner === userId) {
      return res.status(400).json({ 
        message: 'You cannot rent your own cycle', 
        error: 'OWNER_RENTAL_NOT_ALLOWED' 
      });
    }

    // Check if user has an active rental
    const activeRental = await Rental.findOne({
      renter: userId,
      status: 'active'
    });

    if (activeRental) {
      return res.status(400).json({ 
        message: 'You already have an active rental', 
        error: 'ACTIVE_RENTAL_EXISTS',
        existingRental: {
          _id: activeRental._id,
          cycle: activeRental.cycle,
          startTime: activeRental.startTime,
        }
      });
    }

    // Create the rental
    const startTime = new Date();
    const rental = new Rental({
      cycle: cycleId,
      renter: userId,
      owner: cycle.owner,
      startTime: startTime,
      status: 'active',
      duration: 0, // Will be calculated when rental ends
      totalCost: 0, // Will be calculated when rental ends
    });

    // Update cycle status
    cycle.isRented = true;
    
    // Save both documents
    await Promise.all([cycle.save(), rental.save()]);

    // Populate cycle details for response
    await rental.populate('cycle');

    res.status(201).json({ 
      message: 'Cycle rented successfully',
      rental,
      cycle: {
        _id: cycle._id,
        brand: cycle.brand,
        model: cycle.model,
        condition: cycle.condition,
        hourlyRate: cycle.hourlyRate,
        location: cycle.location,
        isRented: cycle.isRented,
        isActive: cycle.isActive,
      }
    });
  } catch (error) {
    console.error('Error in rentCycle:', error);
    res.status(500).json({ 
      message: 'Error renting cycle', 
      error: error.message 
    });
  }
};


// Complete rental
export const completeRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    // Check if user is the renter
    if (rental.renter !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to complete this rental',
        error: 'FORBIDDEN',
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        message: 'Rental is not active',
        error: 'INVALID_STATUS',
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
      rental,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error completing rental',
      error: error.message,
    });
  }
};

// Cancel rental
export const cancelRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    // Check if user is the renter or owner
    if (rental.renter !== req.user.uid && rental.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to cancel this rental',
        error: 'FORBIDDEN',
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        message: 'Rental is not active',
        error: 'INVALID_STATUS',
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
      rental,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error cancelling rental',
      error: error.message,
    });
  }
};
