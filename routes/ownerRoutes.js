const router = require('express').Router();
const ownerController = require('../controllers/ownerController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard-stats', authMiddleware, ownerController.getDashboardStats);
router.post('/cycles', authMiddleware, ownerController.addCycle);
router.get('/my-cycles', authMiddleware, ownerController.getMyCycles);

module.exports = router; 