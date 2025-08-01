import Cycle from '../models/Cycle.js';
import Rental from '../models/Rental.js';
import mongoose from 'mongoose';

// Get nearby cycles with location-based filtering
export const getNearbyCycles = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // Default radius 10km
    
    console.log(`🔍 Fetching nearby cycles for location: ${lat}, ${lng} within ${radius}km`);

    // Base query for active and available cycles
    let query = {
      isActive: true,
      isRented: false,
      coordinates: { $exists: true, $ne: null }
    };

    // If coordinates are provided, add location-based filtering
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusInKm = parseFloat(radius);

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          message: 'Invalid coordinates provided',
          error: 'INVALID_COORDINATES'
        });
      }

      // Add geospatial query for location-based filtering
      // Using $geoWithin with $centerSphere for radius-based search
      query['coordinates'] = {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInKm / 6378.1] // Earth radius in km
        }
      };
    }

    // Find cycles matching the criteria
    const cycles = await Cycle.find(query)
      .select('_id owner brand model condition hourlyRate description location isRented isActive coordinates images createdAt updatedAt')
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(100); // Limit to 100 cycles for performance

    console.log(`✅ Found ${cycles.length} active cycles`);

    // Transform the response to ensure proper coordinate structure
    const transformedCycles = cycles.map(cycle => ({
      _id: cycle._id,
      owner: cycle.owner,
      brand: cycle.brand,
      model: cycle.model,
      condition: cycle.condition,
      hourlyRate: cycle.hourlyRate,
      description: cycle.description,
      location: cycle.location,
      isRented: cycle.isRented,
      isActive: cycle.isActive,
      coordinates: cycle.coordinates ? {
        latitude: cycle.coordinates.latitude,
        longitude: cycle.coordinates.longitude
      } : null,
      images: cycle.images || [],
      createdAt: cycle.createdAt,
      updatedAt: cycle.updatedAt
    }));

    res.json({ 
      cycles: transformedCycles,
      count: transformedCycles.length,
      radius: radiusInKm || 'all',
      center: lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null
    });

  } catch (error) {
    console.error('❌ Error fetching nearby cycles:', error);
    res.status(500).json({
      message: 'Error fetching nearby cycles',
      error: error.message,
    });
  }
};

// Get active cycles specifically for map view with optimized response
export const getActiveCyclesForMap = async (req, res) => {
  try {
    const { lat, lng, radius = 20 } = req.query; // Default radius 20km for map view
    
    console.log(`🗺️ Fetching active cycles for map view: ${lat}, ${lng} within ${radius}km`);

    // Base query for active and available cycles with coordinates
    let query = {
      isActive: true,
      isRented: false,
      $or: [
        { 'coordinates.latitude': { $exists: true, $ne: null } },
        { 'coordinates.coordinates': { $exists: true, $ne: null, $size: 2 } }
      ]
    };

    let cycles;

    // If coordinates are provided, use geospatial query
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusInKm = parseFloat(radius);

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          message: 'Invalid coordinates provided',
          error: 'INVALID_COORDINATES'
        });
      }

      // Use geospatial query for better performance
      cycles = await Cycle.find({
        isActive: true,
        isRented: false,
        'coordinates.coordinates': {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusInKm / 6378.1]
          }
        }
      })
      .select('_id brand model hourlyRate coordinates location condition images')
      .sort({ updatedAt: -1 })
      .limit(150);

    } else {
      // Fallback to basic query without location filtering
      cycles = await Cycle.find(query)
        .select('_id brand model hourlyRate coordinates location condition images')
        .sort({ updatedAt: -1 })
        .limit(100);
    }

    console.log(`✅ Found ${cycles.length} active cycles for map`);

    // Transform cycles for map display with minimal data
    const mapCycles = cycles.map(cycle => {
      let coordinates = null;
      
      // Handle both coordinate formats
      if (cycle.coordinates) {
        if (cycle.coordinates.latitude && cycle.coordinates.longitude) {
          coordinates = {
            latitude: cycle.coordinates.latitude,
            longitude: cycle.coordinates.longitude
          };
        } else if (cycle.coordinates.coordinates && cycle.coordinates.coordinates.length === 2) {
          coordinates = {
            latitude: cycle.coordinates.coordinates[1],
            longitude: cycle.coordinates.coordinates[0]
          };
        }
      }

      return {
        _id: cycle._id,
        brand: cycle.brand,
        model: cycle.model,
        hourlyRate: cycle.hourlyRate,
        coordinates: coordinates,
        location: cycle.location,
        condition: cycle.condition,
        hasImage: cycle.images && cycle.images.length > 0,
        isActive: true,
        isRented: false
      };
    }).filter(cycle => cycle.coordinates !== null); // Only return cycles with valid coordinates

    res.json({ 
      cycles: mapCycles,
      count: mapCycles.length,
      radius: lat && lng ? parseFloat(radius) : 'all',
      center: lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null
    });

  } catch (error) {
    console.error('❌ Error fetching cycles for map:', error);
    res.status(500).json({
      message: 'Error fetching cycles for map',
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

    res.json({
      message: 'Cycle details retrieved successfully',
      cycle: {
        _id: cycle._id,
        brand: cycle.brand,
        model: cycle.model,
        condition: cycle.condition,
        hourlyRate: cycle.hourlyRate,
        description: cycle.description,
        location: cycle.location,
        isRented: cycle.isRented,
        isActive: cycle.isActive,
        images: cycle.images,
      }
    });
  } catch (error) {
    console.error('Error in getCycleById:', error);
    res.status(500).json({
      message: 'Error retrieving cycle details',
      error: error.message,
    });
  }
};

// Enhanced rentCycleByQR with atomic operations and race condition prevention
export const rentCycleByQR = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cycleId } = req.body;
    const userId = req.user.uid;

    console.log(`🔍 Starting rental process for cycle: ${cycleId} by user: ${userId}`);

    // Validate input
    if (!cycleId) {
      await session.abortTransaction();
      console.log('❌ Missing cycleId in request');
      return res.status(400).json({
        message: 'Cycle ID is required',
        error: 'MISSING_CYCLE_ID',
      });
    }

    // Validate ObjectId format
    if (cycleId.length !== 24) {
      await session.abortTransaction();
      console.log('❌ Invalid cycleId format:', cycleId);
      return res.status(400).json({
        message: 'Invalid cycle ID format',
        error: 'INVALID_ID_FORMAT',
      });
    }

    console.log('🔍 Finding cycle in database...');

    // Use findOneAndUpdate with session for atomic operation
    // This prevents race conditions by ensuring only one user can rent a cycle at a time
    const cycle = await Cycle.findOneAndUpdate(
      { 
        _id: cycleId, 
        isActive: true, 
        isRented: false // Ensure not already rented
      },
      { 
        isRented: true,
        currentRenter: userId,
        lastRentedAt: new Date()
      },
      { 
        new: true, 
        session // Use transaction session
      }
    );

    if (!cycle) {
      await session.abortTransaction();
      console.log('❌ Cycle not found or not available:', cycleId);
      return res.status(400).json({ 
        message: 'Cycle is not available for rent (may be inactive or already rented)', 
        error: 'CYCLE_UNAVAILABLE_OR_INACTIVE'
      });
    }

    console.log('✅ Cycle found and updated:', cycle._id);

    // Check if user is trying to rent their own cycle
    if (cycle.owner === userId) {
      await session.abortTransaction();
      console.log('❌ User trying to rent their own cycle');
      return res.status(400).json({ 
        message: 'You cannot rent your own cycle', 
        error: 'OWNER_RENTAL_NOT_ALLOWED' 
      });
    }

    console.log('🔍 Checking for existing active rentals...');

    // Check if user has an active rental
    const activeRental = await Rental.findOne({
      renter: userId,
      status: 'active'
    }).session(session);

    if (activeRental) {
      await session.abortTransaction();
      console.log('❌ User already has active rental:', activeRental._id);
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

    console.log('✅ No existing active rentals found');

    // Create rental record
    const rental = new Rental({
      cycle: cycleId,
      renter: userId,
      owner: cycle.owner,
      startTime: new Date(),
      status: 'active',
      hourlyRate: cycle.hourlyRate
    });

    console.log('🔍 Saving rental record...');
    await rental.save({ session });
    await session.commitTransaction();

    console.log(`✅ Rental started successfully: Cycle ${cycleId} rented by user ${userId}`);

    res.json({
      message: 'Rental started successfully',
      rental: {
        _id: rental._id,
        cycle: rental.cycle,
        startTime: rental.startTime,
        hourlyRate: rental.hourlyRate,
        status: rental.status
      },
      cycle: {
        _id: cycle._id,
        brand: cycle.brand,
        model: cycle.model,
        condition: cycle.condition,
        hourlyRate: cycle.hourlyRate,
        location: cycle.location,
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error in rentCycleByQR:', error);
    res.status(500).json({ 
      message: 'Error processing rental request', 
      error: error.message 
    });
  } finally {
    session.endSession();
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

// Get all active cycles
export const getAllCycles = async (req, res) => {
  try {
    console.log('🔍 Fetching all active cycles');

    // Get only active and available cycles with coordinates
    const cycles = await Cycle.find({
      isActive: true,
      isRented: false,
      coordinates: { $exists: true, $ne: null }
    })
    .select('_id owner brand model condition hourlyRate description location isRented isActive coordinates images createdAt updatedAt')
    .sort({ createdAt: -1 })
    .limit(200); // Limit for performance

    console.log(`✅ Found ${cycles.length} active cycles`);

    // Transform the response to ensure consistent structure
    const transformedCycles = cycles.map(cycle => ({
      _id: cycle._id,
      owner: cycle.owner,
      brand: cycle.brand,
      model: cycle.model,
      condition: cycle.condition,
      hourlyRate: cycle.hourlyRate,
      description: cycle.description,
      location: cycle.location,
      isRented: cycle.isRented,
      isActive: cycle.isActive,
      coordinates: cycle.coordinates ? {
        latitude: cycle.coordinates.latitude,
        longitude: cycle.coordinates.longitude
      } : null,
      images: cycle.images || [],
      createdAt: cycle.createdAt,
      updatedAt: cycle.updatedAt
    }));

    res.json({ 
      cycles: transformedCycles,
      count: transformedCycles.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching cycles',
      error: error.message,
    });
  }
};

// Test endpoint for debugging rental issues
export const testRentalEndpoint = async (req, res) => {
  try {
    const { cycleId } = req.body;
    const userId = req.user.uid;

    console.log('🧪 Test endpoint called');
    console.log('cycleId:', cycleId);
    console.log('userId:', userId);

    // Check if cycle exists
    const cycle = await Cycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({
        message: 'Cycle not found',
        error: 'CYCLE_NOT_FOUND',
        cycleId: cycleId
      });
    }

    // Check cycle status
    const cycleStatus = {
      _id: cycle._id,
      brand: cycle.brand,
      model: cycle.model,
      isActive: cycle.isActive,
      isRented: cycle.isRented,
      owner: cycle.owner,
      currentRenter: cycle.currentRenter
    };

    // Check if user has active rentals
    const activeRentals = await Rental.find({
      renter: userId,
      status: 'active'
    });

    res.json({
      message: 'Test endpoint response',
      cycleStatus: cycleStatus,
      userActiveRentals: activeRentals.length,
      canRent: cycle.isActive && !cycle.isRented && cycle.owner !== userId && activeRentals.length === 0
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      message: 'Test endpoint error',
      error: error.message
    });
  }
};
