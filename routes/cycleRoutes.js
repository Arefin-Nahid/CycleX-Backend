import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getNearbyCycles,
  getCycleById,
  searchCycles,
  updateCycle,
  deleteCycle,
  getAllCycles,
  getActiveCyclesForMap,
  debugCycles,
  rentCycleByQR,
  testRentalEndpoint,
  initializeCyclesInFirebase,
} from '../controllers/cycleController.js';
import mongoFirebaseSync from '../services/mongoFirebaseSync.js';

const router = Router();

// Public routes
router.get('/', getAllCycles); // Get all available cycles
router.get('/search', searchCycles); // Search for cycles by query
router.get('/nearby', getNearbyCycles); // Get nearby cycles
router.get('/map/active', getActiveCyclesForMap); // Get active cycles for map view
router.get('/debug', debugCycles); // Debug endpoint to check cycles
router.get('/:id', getCycleById); // Get cycle by ID

// Protected routes (require authentication)
router.use(authMiddleware);

router.patch('/:id', updateCycle); // Update cycle details
router.delete('/:id', deleteCycle); // Delete cycle
router.post('/rent-by-qr', rentCycleByQR); // Rent cycle by QR code
router.post('/test-rental', testRentalEndpoint); // Test endpoint for debugging
router.post('/initialize-firebase', initializeCyclesInFirebase); // Initialize cycles in Firebase

// Manual sync route
router.post('/sync-firebase', async (req, res) => {
  try {
    console.log('Manual sync requested...');
    await mongoFirebaseSync.initialSync();
    res.json({
      message: 'Manual sync completed successfully',
      status: 'success'
    });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      message: 'Error during manual sync',
      error: error.message
    });
  }
});

// Get sync status
router.get('/sync-status', (req, res) => {
  try {
    const status = mongoFirebaseSync.getStatus();
    res.json({
      message: 'Sync status retrieved',
      status: status
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error getting sync status',
      error: error.message
    });
  }
});

export default router;
