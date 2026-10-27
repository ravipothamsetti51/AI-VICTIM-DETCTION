const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'aerosentry_classified_disaster_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
        error: 'ValidationError',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A tactical operator with this email is already registered.',
        error: 'DuplicateEmailError',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: ['admin', 'operator', 'rescuer'].includes(role) ? role : 'rescuer',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Operator account successfully provisioned.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password credentials are required.',
        error: 'ValidationError',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization credentials.',
        error: 'InvalidCredentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization credentials.',
        error: 'InvalidCredentials',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Authentication successful. Command clearance granted.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// GET /api/auth/users (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/users/:id/role (Admin only)
router.patch('/users/:id/role', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'operator', 'rescuer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be admin, operator, or rescuer.',
        error: 'ValidationError',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'NotFound',
      });
    }

    res.status(200).json({
      success: true,
      message: `Security role updated to ${role}`,
      user,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
