import Cycle from '../models/Cycle.js';
import Rental from '../models/Rental.js';

// Get nearby cycles
export const getNearbyCycles = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // Add radius for location-based filtering if needed

    // Get only active and available cycles
    const cycles = await Cycle.find({
      isActive: true,
      isRented: false,
      // Location-based filtering can be implemented here
      // e.g., use $geoWithin with geospatial data if the schema supports it
    });

    res.json({ cycles });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching nearby cycles',
      error: error.message,
    });
  }
};

// Get cycle by ID - Enhanced for QR scanning
export const getCycleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || id.length !== 24) {
      return res.status(400).json({
        message: 'Invalid cycle ID format',
        error: 'INVALID_ID_FORMAT',
      });
    }

    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND',
      });
    }

    // Check if cycle is available for rent
    if (cycle.isRented) {
      return res.status(400).json({
        message: 'Cycle is currently rented',
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

    res.json({ 
      message: 'Cycle found successfully',
      cycle 
    });
  } catch (error) {
    console.error('Error in getCycleById:', error);
    res.status(500).json({
      message: 'Error fetching cycle',
      error: error.message,
    });
  }
};

// Rent cycle by QR code
export const rentCycleByQR = async (req, res) => {
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

    // Check if cycle is available
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
      message: 'Cycle rented successfully via QR code',
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
    console.error('Error in rentCycleByQR:', error);
    res.status(500).json({ 
      message: 'Error renting cycle via QR code', 
      error: error.message 
    });
  }
};

// Search cycles
export const searchCycles = async (req, res) => {
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
      error: error.message,
    });
  }
};

// Update cycle
export const updateCycle = async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);

    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND',
      });
    }

    // Check ownership
    if (cycle.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to update this cycle',
        error: 'FORBIDDEN',
      });
    }

    // Update fields
    Object.assign(cycle, req.body);
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
    const cycle = await Cycle.findById(req.params.id);

    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND',
      });
    }

    // Check ownership
    if (cycle.owner !== req.user.uid) {
      return res.status(403).json({
        message: 'Not authorized to delete this cycle',
        error: 'FORBIDDEN',
      });
    }

    await cycle.remove();

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

// Get all cycles
export const getAllCycles = async (req, res) => {
  try {
    const cycles = await Cycle.find({ isRented: false });

    res.json({ cycles });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching cycles',
      error: error.message,
    });
  }
};
