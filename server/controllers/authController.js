import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwttokenkey987654321', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, phone, photo } = req.body;

  try {
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, password and phone number' });
    }

    // Phone number format validation (exactly 10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Phone number must be exactly 10 digits' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User with this email or phone number already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      photo: photo || '',
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// @desc    Get all registered contacts (excluding self)
// @route   GET /api/auth/contacts
// @access  Private
export const getContacts = async (req, res) => {
  try {
    const contacts = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ name: 1 });
    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error('GetContacts error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

