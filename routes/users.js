const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, address, uid } = req.body;
    
    const user = new User({
      name,
      email,
      phone,
      address,
      uid,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

module.exports = router; 