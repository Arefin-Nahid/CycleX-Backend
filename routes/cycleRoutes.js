const router = require('express').Router();
const Cycle = require('../models/Cycle');
const authMiddleware = require('../middleware/authMiddleware');

// Add a new cycle (for owners)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { model, hourlyRate, location } = req.body;
    const cycle = new Cycle({
      ownerUID: req.user.uid,
      model,
      hourlyRate,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    });

    await cycle.save();
    res.status(201).json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get nearby cycles
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query; // maxDistance in meters

    const cycles = await Cycle.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: 'available'
    });

    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get owner's cycles
router.get('/my-cycles', authMiddleware, async (req, res) => {
  try {
    const cycles = await Cycle.find({ ownerUID: req.user.uid });
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cycle status
router.patch('/:cycleId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const cycle = await Cycle.findById(req.params.cycleId);

    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }

    if (cycle.ownerUID !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    cycle.status = status;
    await cycle.save();
    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 