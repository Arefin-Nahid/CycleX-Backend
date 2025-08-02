import { Router } from 'express';
import {
  createOrUpdateUser,
  getUserProfile,
  updateUserRole,
  updateProfilePicture,
} from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Create/Update user profile (No authMiddleware as per your comment)
router.post('/create', createOrUpdateUser);

// Get user profile
router.get('/:uid', authMiddleware, getUserProfile);

// Update user role
router.post('/update-role', authMiddleware, updateUserRole);

// Update profile picture
router.post('/update-profile-picture', authMiddleware, updateProfilePicture);

export default router;
