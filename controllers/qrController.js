import Cycle from '../models/Cycle.js';
import Rental from '../models/Rental.js';

// Generate QR data for a specific cycle
export const generateQRData = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userId = req.user.uid;

    // Validate cycle ID format
    if (!cycleId || cycleId.length !== 24) {
      return res.status(400).json({ 
        message: 'Invalid cycle ID format', 
        error: 'INVALID_ID_FORMAT' 
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

    // Check if user owns this cycle
    if (cycle.owner !== userId) {
      return res.status(403).json({ 
        message: 'Not authorized to generate QR for this cycle', 
        error: 'FORBIDDEN' 
      });
    }

    // Generate QR data
    const qrData = {
      cycleId: cycle._id.toString(),
      brand: cycle.brand,
      model: cycle.model,
      hourlyRate: cycle.hourlyRate,
      location: cycle.location,
      timestamp: new Date().toISOString(),
    };

    res.json({ 
      message: 'QR data generated successfully', 
      qrData, 
      qrString: JSON.stringify(qrData) 
    });
  } catch (error) {
    console.error('Error in generateQRData:', error);
    res.status(500).json({ 
      message: 'Error generating QR data', 
      error: error.message 
    });
  }
};

// Validate QR data
export const validateQRData = async (req, res) => {
  try {
    const { qrString } = req.body;
    const userId = req.user.uid;

    if (!qrString) {
      return res.status(400).json({ 
        message: 'QR string is required', 
        error: 'MISSING_QR_STRING' 
      });
    }

    let qrData;
    try {
      qrData = JSON.parse(qrString);
    } catch (parseError) {
      return res.status(400).json({ 
        message: 'Invalid QR code format', 
        error: 'INVALID_QR_FORMAT' 
      });
    }

    // Validate required fields
    if (!qrData.cycleId) {
      return res.status(400).json({ 
        message: 'Invalid QR code: missing cycle ID', 
        error: 'INVALID_QR_CONTENT' 
      });
    }

    // Find the cycle
    const cycle = await Cycle.findById(qrData.cycleId);
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

    res.json({ 
      message: 'QR code is valid', 
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
    console.error('Error in validateQRData:', error);
    res.status(500).json({ 
      message: 'Error validating QR data', 
      error: error.message 
    });
  }
};

// Get QR statistics
export const getQRStats = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get total cycles owned by user
    const totalCycles = await Cycle.countDocuments({ owner: userId });
    
    // Get active cycles (available for QR scanning)
    const activeCycles = await Cycle.countDocuments({ 
      owner: userId, 
      isActive: true, 
      isRented: false 
    });

    // Get QR scans today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const qrScansToday = await Rental.countDocuments({
      owner: userId,
      startTime: { $gte: today }
    });

    // Get total QR rentals
    const totalQRRentals = await Rental.countDocuments({ owner: userId });

    res.json({
      message: 'QR statistics retrieved successfully',
      stats: {
        totalCycles,
        activeCycles,
        qrScansToday,
        totalQRRentals,
      }
    });
  } catch (error) {
    console.error('Error in getQRStats:', error);
    res.status(500).json({ 
      message: 'Error getting QR statistics', 
      error: error.message 
    });
  }
};

// Get QR code for a cycle (simple version - just returns cycle ID)
export const getQRCode = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userId = req.user.uid;

    // Validate cycle ID format
    if (!cycleId || cycleId.length !== 24) {
      return res.status(400).json({ 
        message: 'Invalid cycle ID format', 
        error: 'INVALID_ID_FORMAT' 
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

    // Check if user owns this cycle
    if (cycle.owner !== userId) {
      return res.status(403).json({ 
        message: 'Not authorized to access this cycle', 
        error: 'FORBIDDEN' 
      });
    }

    // Return simple QR data (just the cycle ID)
    res.json({
      message: 'QR code generated successfully',
      qrData: cycleId,
      cycle: {
        _id: cycle._id,
        brand: cycle.brand,
        model: cycle.model,
        hourlyRate: cycle.hourlyRate,
        location: cycle.location,
      }
    });
  } catch (error) {
    console.error('Error in getQRCode:', error);
    res.status(500).json({ 
      message: 'Error generating QR code', 
      error: error.message 
    });
  }
}; 