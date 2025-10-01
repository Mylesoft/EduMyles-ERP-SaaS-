const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');
const { authRateLimitMiddleware, passwordResetRateLimitMiddleware } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Login
router.post('/login', [
  authRateLimitMiddleware,
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user with school information
  const user = await db('users')
    .select(
      'users.*',
      'schools.name as school_name',
      'schools.code as school_code',
      'schools.status as school_status'
    )
    .leftJoin('schools', 'users.school_id', 'schools.id')
    .where('users.email', email)
    .first();

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      error: 'Account suspended',
      message: 'Your account has been suspended'
    });
  }

  if (user.school_status && user.school_status !== 'active') {
    return res.status(403).json({
      error: 'School suspended',
      message: 'Your school account has been suspended'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  // Get user roles
  const userRoles = await db('user_roles')
    .select(
      'roles.id',
      'roles.name',
      'roles.slug',
      'roles.permissions'
    )
    .join('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', user.id);

  // Combine permissions
  const permissions = new Set();
  userRoles.forEach(role => {
    const rolePermissions = JSON.parse(role.permissions || '[]');
    rolePermissions.forEach(permission => permissions.add(permission));
  });

  // Create JWT token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  // Update last login
  await db('users')
    .where('id', user.id)
    .update({ last_login: new Date() });

  // Remove sensitive data
  delete user.password_hash;

  res.json({
    success: true,
    token,
    user: {
      ...user,
      roles: userRoles,
      permissions: Array.from(permissions)
    }
  });
}));

// Register (for school admins during school setup)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('schoolName').trim().isLength({ min: 3 }),
  body('schoolCode').trim().isLength({ min: 2 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, password, firstName, lastName, schoolName, schoolCode, phone } = req.body;

  // Check if user already exists
  const existingUser = await db('users').where('email', email).first();
  if (existingUser) {
    return res.status(400).json({
      error: 'User already exists',
      message: 'An account with this email already exists'
    });
  }

  // Check if school code is taken
  const existingSchool = await db('schools').where('code', schoolCode.toUpperCase()).first();
  if (existingSchool) {
    return res.status(400).json({
      error: 'School code taken',
      message: 'This school code is already in use'
    });
  }

  const trx = await db.transaction();

  try {
    // Create school
    const [school] = await trx('schools').insert({
      name: schoolName,
      code: schoolCode.toUpperCase(),
      email: email,
      phone: phone,
      status: 'trial',
      subscription_tier: 'basic'
    }).returning('*');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await trx('users').insert({
      school_id: school.id,
      email: email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      status: 'active'
    }).returning('*');

    // Get school admin role
    const schoolAdminRole = await trx('roles').where('slug', 'school-admin').first();

    // Assign school admin role
    await trx('user_roles').insert({
      user_id: user.id,
      role_id: schoolAdminRole.id,
      school_id: school.id
    });

    await trx.commit();

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove sensitive data
    delete user.password_hash;

    res.status(201).json({
      success: true,
      message: 'School and admin account created successfully',
      token,
      user: {
        ...user,
        school_name: school.name,
        school_code: school.code,
        roles: [{ ...schoolAdminRole }]
      }
    });
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}));

// Forgot password
router.post('/forgot-password', [
  passwordResetRateLimitMiddleware,
  body('email').isEmail().normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email } = req.body;

  const user = await db('users').where('email', email).first();
  
  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });

  if (user) {
    // TODO: Generate reset token and send email
    // For now, we'll just log it
    console.log(`Password reset requested for user: ${user.id}`);
  }
}));

// Get current user profile
router.get('/me', require('../middleware/auth').authMiddleware, asyncHandler(async (req, res) => {
  const user = { ...req.user };
  delete user.password_hash;

  res.json({
    success: true,
    user
  });
}));

// Refresh token
router.post('/refresh', require('../middleware/auth').authMiddleware, asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  res.json({
    success: true,
    token
  });
}));

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;