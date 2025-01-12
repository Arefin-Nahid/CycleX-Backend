import Cycle from '../models/Cycle.js';
import User from '../models/User.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.uid;
    const totalCycles = await Cycle.countDocuments({ owner: userId });
    const rentedCycles = await Cycle.countDocuments({ owner: userId, isRented: true });
    const availableCycles = await Cycle.countDocuments({ owner: userId, isRented: false });

    res.json({
      totalCycles,
      rentedCycles,
      availableCycles
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Add a new cycle
export const addCycle = async (req, res) => {
  try {
    const { brand, model, condition, hourlyRate, description, location } = req.body;
    const owner = req.user.uid;

    const cycle = new Cycle({
      owner,
      brand,
      model,
      condition,
      hourlyRate,
      description,
      location
    });

    await cycle.save();

    res.status(201).json({
      message: 'Cycle added successfully',
      cycle
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error adding cycle',
      error: error.message
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
      error: error.message
    });
  }
}; 