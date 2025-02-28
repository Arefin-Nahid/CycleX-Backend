import User from '../models/User.js';

// Create or update user profile
export const createOrUpdateUser = async (req, res) => {
  try {
    console.log('Create/Update user profile:', req.body);
    const { uid, email, name, studentId, department, phone, address } = req.body;

    // Validate required fields
    if (!uid || !email || !name) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'MISSING_FIELDS',
      });
    }

    // Check if user exists
    let user = await User.findOne({ uid });
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
        user,
      });
    } else {
      // Create new user
      user = new User({
        uid,
        email,
        name,
        studentId,
        department,
        phone,
        address,
      });

      await user.save();

      return res.status(201).json({
        message: 'User profile created successfully',
        user,
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        message: `Duplicate entry found for ${field}`,
        error: 'DUPLICATE_ENTRY',
        field,
      });
    }

    return res.status(500).json({
      message: 'Error processing request',
      error: error.message,
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      message: 'Error fetching user profile',
      error: error.message,
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { uid, role } = req.body;

    if (!['renter', 'owner'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role specified',
        error: 'INVALID_ROLE',
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
        error: 'USER_NOT_FOUND',
      });
    }

    res.json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      message: 'Error updating user role',
      error: error.message,
    });
  }
};
