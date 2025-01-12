import { Router } from 'express';
const router = Router();
import User from '../models/User.js';

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

export default router; 