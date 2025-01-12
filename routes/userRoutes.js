const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware');

// Create/Update user profile
// authMiddleware removed -- later seee if error
router.post('/create' ,async (req, res) => {
  try {
    console.log("create user");
    console.log(req.body);
    const { uid, email, name, studentId, department, phone, address } = req.body;

    // Validate required fields
    if (!uid || !email || !name) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'MISSING_FIELDS'
      });
    }

    // Check if user exists
    let user = await User.findOne({ uid: uid });
    console.log("user");
    console.log(user);
    
    if (user) {
      // Update existing user
      user.name = name;
      user.studentId = studentId;
      user.department = department;
      user.phone = phone;
      user.address = address;
      
      await user.save();
      
      return res.json({
        message: 'User profile updated successfully',
        user
      });
    } else {
      console.log("create new user");
      console.log(uid);
      user = new User({
        uid: uid,
        email,
        name,
        studentId,
        department,
        phone,
        address
      });
      console.log(user);
      
      await user.save();
      
      return res.status(201).json({
        message: 'User profile created successfully',
        user
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        message: `Duplicate entry found for ${field}`,
        error: 'DUPLICATE_ENTRY',
        field
      });
    }

    return res.status(500).json({
      message: 'Error processing request',
      error: error.message
    });
  }
});

// Get user profile
router.get('/:uid', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    console.log(user);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Update user role
router.post('/update-role', authMiddleware, async (req, res) => {
  try {
    const { uid, role } = req.body;

    if (!['renter', 'owner'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role specified',
        error: 'INVALID_ROLE'
      });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user role',
      error: error.message
    });
  }
});

module.exports = router; 