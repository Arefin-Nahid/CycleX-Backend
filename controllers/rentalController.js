import Rental from '../models/Rental.js';
import Cycle from '../models/Cycle.js';
import FirebaseService from '../services/firebaseService.js';
import { 
  getCurrentTimeInBangladesh, 
  convertToBangladeshTime, 
  formatBangladeshTime,
  getTimeDifference 
} from '../utils/timezone.js';

// Get user's rentals
export const getMyRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ renter: req.user.uid })
      .populate('cycle')
      .sort({ createdAt: -1 });

    // Convert timestamps to Bangladesh timezone for display
    const formattedRentals = rentals.map(rental => ({
      ...rental.toObject(),
      startTime: formatBangladeshTime(rental.startTime),
      endTime: rental.endTime ? formatBangladeshTime(rental.endTime) : null,
      createdAt: formatBangladeshTime(rental.createdAt),
      updatedAt: formatBangladeshTime(rental.updatedAt),
    }));

    res.json({ rentals: formattedRentals });
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

    // Convert timestamps to Bangladesh timezone for display
    const formattedRental = {
      ...rental.toObject(),
      startTime: formatBangladeshTime(rental.startTime),
      endTime: rental.endTime ? formatBangladeshTime(rental.endTime) : null,
      createdAt: formatBangladeshTime(rental.createdAt),
      updatedAt: formatBangladeshTime(rental.updatedAt),
    };

    res.json({ rental: formattedRental });
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

    // Check if user already has an active rental
    const existingRental = await Rental.findOne({
      renter: userId,
      status: 'active',
    });

    if (existingRental) {
      return res.status(400).json({
        message: 'You already have an active rental. Please complete or cancel it first.',
        error: 'ACTIVE_RENTAL_EXISTS',
        existingRental: {
          _id: existingRental._id,
          startTime: formatBangladeshTime(existingRental.startTime),
          status: existingRental.status,
        }
      });
    }

    // Get current time in Bangladesh timezone
    const currentTime = getCurrentTimeInBangladesh();
    const endTime = currentTime.clone().add(24, 'hours'); // Default 24 hours

    // Create rental with Bangladesh timezone
    const rental = new Rental({
      cycle: cycleId,
      renter: userId,
      owner: cycle.owner,
      startTime: currentTime.toDate(),
      endTime: endTime.toDate(),
      duration: 0, // Will be calculated when rental ends
      distance: 0, // Will be updated when rental ends
      totalCost: 0, // Will be calculated when rental ends
      status: 'active',
      paymentStatus: 'pending',
    });

    // Update cycle status
    cycle.isRented = true;
    await cycle.save();

    // Save rental
    await rental.save();

    // Format response with Bangladesh timezone
    const formattedRental = {
      ...rental.toObject(),
      startTime: formatBangladeshTime(rental.startTime),
      endTime: formatBangladeshTime(rental.endTime),
      createdAt: formatBangladeshTime(rental.createdAt),
      updatedAt: formatBangladeshTime(rental.updatedAt),
    };

    res.status(201).json({
      message: 'Rental created successfully',
      rental: formattedRental,
      timezone: 'Asia/Dhaka (GMT+6)',
    });
  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({
      message: 'Error creating rental',
      error: error.message,
    });
  }
};


// Complete rental
export const completeRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('cycle');

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

    // Calculate duration and cost
    const endTime = new Date();
    const startTime = new Date(rental.startTime);
    const durationInMs = endTime - startTime;
    const durationInHours = durationInMs / (1000 * 60 * 60); // Convert to hours
    const hourlyRate = rental.cycle.hourlyRate || 0;
    const totalCost = durationInHours * hourlyRate;

    // Update rental with calculated values
    rental.status = 'completed';
    rental.endTime = endTime;
    rental.duration = Math.round(durationInHours * 100) / 100; // Round to 2 decimal places
    rental.totalCost = Math.round(totalCost * 100) / 100; // Round to 2 decimal places

    // Add rating and review if provided
    if (req.body.rating) {
      rental.rating = req.body.rating;
    }
    if (req.body.review) {
      rental.review = req.body.review;
    }

    await rental.save();

    // Update cycle availability
    const cycle = await Cycle.findById(rental.cycle._id);
    if (cycle) {
      cycle.isRented = false;
      await cycle.save();
      
      // 🔓 Unlock the cycle in Firebase Realtime Database (isLocked = 0)
      console.log('🔓 Unlocking cycle in Firebase Realtime Database...');
      try {
        await FirebaseService.updateCycleLockStatus(cycle._id.toString(), 0);
        console.log('Firebase: Cycle unlocked successfully');
      } catch (firebaseError) {
                  console.error('Firebase: Error unlocking cycle:', firebaseError);
        // Don't fail the entire completion process if Firebase fails
        // The rental completion is still valid, just the hardware unlock might not work
      }
    }

    res.json({
      message: 'Rental completed successfully',
      rental: {
        _id: rental._id,
        cycle: {
          _id: rental.cycle._id,
          brand: rental.cycle.brand,
          model: rental.cycle.model,
          location: rental.cycle.location,
        },
        startTime: rental.startTime,
        endTime: rental.endTime,
        duration: rental.duration,
        totalCost: rental.totalCost,
        status: rental.status,
        rating: rental.rating,
        review: rental.review,
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

// Debug rental status
export const debugRentalStatus = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user's active rentals
    const activeRentals = await Rental.find({
      renter: userId,
      status: 'active'
    }).populate('cycle');
    
    // Get cycles that might be stuck as rented
    const rentedCycles = await Cycle.find({
      isRented: true,
      isActive: true
    });
    
    // Check for orphaned rentals (cycles marked as rented but no active rental)
    const orphanedCycles = [];
    for (const cycle of rentedCycles) {
      const hasActiveRental = await Rental.findOne({
        cycle: cycle._id,
        status: 'active'
      });
      
      if (!hasActiveRental) {
        orphanedCycles.push({
          _id: cycle._id,
          brand: cycle.brand,
          model: cycle.model,
          owner: cycle.owner,
          isRented: cycle.isRented,
          isActive: cycle.isActive
        });
      }
    }
    
    res.json({
      userId,
      activeRentals: activeRentals.length,
      rentedCycles: rentedCycles.length,
      orphanedCycles: orphanedCycles,
      activeRentalDetails: activeRentals.map(r => ({
        _id: r._id,
        cycle: r.cycle._id,
        cycleBrand: r.cycle.brand,
        startTime: r.startTime,
        status: r.status
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error debugging rental status',
      error: error.message,
    });
  }
};

// Fix orphaned cycles (cycles marked as rented but no active rental)
export const fixOrphanedCycles = async (req, res) => {
  try {
    const rentedCycles = await Cycle.find({
      isRented: true,
      isActive: true
    });
    
    const fixedCycles = [];
    
    for (const cycle of rentedCycles) {
      const hasActiveRental = await Rental.findOne({
        cycle: cycle._id,
        status: 'active'
      });
      
      if (!hasActiveRental) {
        cycle.isRented = false;
        await cycle.save();
        fixedCycles.push({
          _id: cycle._id,
          brand: cycle.brand,
          model: cycle.model
        });
      }
    }
    
    res.json({
      message: `Fixed ${fixedCycles.length} orphaned cycles`,
      fixedCycles
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fixing orphaned cycles',
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
      
      // 🔓 Unlock the cycle in Firebase Realtime Database (isLocked = 0)
      console.log('🔓 Unlocking cycle in Firebase Realtime Database (cancelled rental)...');
      try {
        await FirebaseService.updateCycleLockStatus(cycle._id.toString(), 0);
        console.log('Firebase: Cycle unlocked successfully (cancelled rental)');
      } catch (firebaseError) {
                  console.error('Firebase: Error unlocking cycle (cancelled rental):', firebaseError);
        // Don't fail the entire cancellation process if Firebase fails
        // The rental cancellation is still valid, just the hardware unlock might not work
      }
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
