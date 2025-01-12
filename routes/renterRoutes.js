const router = require('express').Router();
const renterController = require('../controllers/renterController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard-stats', authMiddleware, renterController.getDashboardStats);
router.post('/rentals', authMiddleware, renterController.createRental);

module.exports = router; 