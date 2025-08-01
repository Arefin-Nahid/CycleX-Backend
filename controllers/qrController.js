import Cycle from '../models/Cycle.js';

// Generate QR code data for a cycle
export const generateQRData = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userId = req.user.uid;

    // Validate ObjectId format
    if (!cycleId || cycleId.length !== 24) {
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
        error: 'CYCLE_NOT_FOUND',
      });
    }

    // Check ownership
    if (cycle.owner !== userId) {
      return res.status(403).json({
        message: 'Not authorized to generate QR for this cycle',
        error: 'FORBIDDEN',
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
      qrString: JSON.stringify(qrData),
    });
  } catch (error) {
    console.error('Error in generateQRData:', error);
    res.status(500).json({
      message: 'Error generating QR data',
      error: error.message,
    });
  }
};

// Validate QR code data
export const validateQRData = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        message: 'QR data is required',
        error: 'MISSING_QR_DATA',
      });
    }

    let parsedData;
    try {
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (parseError) {
      return res.status(400).json({
        message: 'Invalid QR data format',
        error: 'INVALID_QR_FORMAT',
      });
    }

    // Validate required fields
    if (!parsedData.cycleId) {
      return res.status(400).json({
        message: 'Cycle ID is missing from QR data',
        error: 'MISSING_CYCLE_ID',
      });
    }

    // Validate ObjectId format
    if (parsedData.cycleId.length !== 24) {
      return res.status(400).json({
        message: 'Invalid cycle ID format in QR data',
        error: 'INVALID_ID_FORMAT',
      });
    }

    // Find the cycle
    const cycle = await Cycle.findById(parsedData.cycleId);
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
      message: 'QR data is valid',
      isValid: true,
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
    console.error('Error in validateQRData:', error);
    res.status(500).json({
      message: 'Error validating QR data',
      error: error.message,
    });
  }
};

// Get QR code statistics for a cycle owner
export const getQRStats = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all cycles owned by the user
    const cycles = await Cycle.find({ owner: userId });

    // Get QR scan statistics (this would need to be implemented based on your tracking needs)
    const stats = {
      totalCycles: cycles.length,
      activeCycles: cycles.filter(cycle => cycle.isActive).length,
      availableCycles: cycles.filter(cycle => cycle.isActive && !cycle.isRented).length,
      rentedCycles: cycles.filter(cycle => cycle.isRented).length,
    };

    res.json({
      message: 'QR statistics retrieved successfully',
      stats,
    });
  } catch (error) {
    console.error('Error in getQRStats:', error);
    res.status(500).json({
      message: 'Error retrieving QR statistics',
      error: error.message,
    });
  }
}; 