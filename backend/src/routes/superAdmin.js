const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');
const { requireRole, requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware to ensure super admin access
router.use(requireRole('super-admin'));

// Dashboard - System overview
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [
    totalSchools,
    activeSchools,
    trialSchools,
    totalUsers,
    systemLogs
  ] = await Promise.all([
    db('schools').count('id as count').first(),
    db('schools').where('status', 'active').count('id as count').first(),
    db('schools').where('status', 'trial').count('id as count').first(),
    db('users').count('id as count').first(),
    db('audit_logs')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10)
  ]);

  // Get schools by subscription tier
  const subscriptionStats = await db('schools')
    .select('subscription_tier')
    .count('id as count')
    .groupBy('subscription_tier');

  res.json({
    success: true,
    data: {
      overview: {
        totalSchools: parseInt(totalSchools.count),
        activeSchools: parseInt(activeSchools.count),
        trialSchools: parseInt(trialSchools.count),
        totalUsers: parseInt(totalUsers.count)
      },
      subscriptionStats,
      recentLogs: systemLogs
    }
  });
}));

// Get all schools with pagination
router.get('/schools', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, subscription_tier } = req.query;
  const offset = (page - 1) * limit;

  let query = db('schools')
    .select(
      'schools.*',
      db.raw('COUNT(users.id) as user_count')
    )
    .leftJoin('users', 'schools.id', 'users.school_id')
    .groupBy('schools.id');

  // Apply filters
  if (search) {
    query = query.where(function() {
      this.where('schools.name', 'ilike', `%${search}%`)
          .orWhere('schools.code', 'ilike', `%${search}%`)
          .orWhere('schools.email', 'ilike', `%${search}%`);
    });
  }

  if (status) {
    query = query.where('schools.status', status);
  }

  if (subscription_tier) {
    query = query.where('schools.subscription_tier', subscription_tier);
  }

  const schools = await query
    .orderBy('schools.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const totalCount = await db('schools')
    .count('id as count')
    .modify((queryBuilder) => {
      if (search) {
        queryBuilder.where(function() {
          this.where('name', 'ilike', `%${search}%`)
              .orWhere('code', 'ilike', `%${search}%`)
              .orWhere('email', 'ilike', `%${search}%`);
        });
      }
      if (status) queryBuilder.where('status', status);
      if (subscription_tier) queryBuilder.where('subscription_tier', subscription_tier);
    })
    .first();

  res.json({
    success: true,
    data: schools,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
}));

// Get specific school details
router.get('/schools/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const school = await db('schools')
    .select(
      'schools.*',
      db.raw('COUNT(users.id) as user_count')
    )
    .leftJoin('users', 'schools.id', 'users.school_id')
    .where('schools.id', id)
    .groupBy('schools.id')
    .first();

  if (!school) {
    return res.status(404).json({
      error: 'School not found'
    });
  }

  // Get recent activity for this school
  const recentActivity = await db('audit_logs')
    .where('school_id', id)
    .orderBy('created_at', 'desc')
    .limit(10);

  res.json({
    success: true,
    data: {
      ...school,
      recentActivity
    }
  });
}));

// Create new school
router.post('/schools', [
  body('name').trim().isLength({ min: 3 }),
  body('code').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('subscription_tier').isIn(['basic', 'premium', 'enterprise'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { name, code, email, phone, address, website, subscription_tier, status = 'trial' } = req.body;

  // Check if school code is taken
  const existingSchool = await db('schools').where('code', code.toUpperCase()).first();
  if (existingSchool) {
    return res.status(400).json({
      error: 'School code already exists'
    });
  }

  const [school] = await db('schools').insert({
    name,
    code: code.toUpperCase(),
    email,
    phone,
    address,
    website,
    subscription_tier,
    status
  }).returning('*');

  // Log the action
  await db('audit_logs').insert({
    user_id: req.user.id,
    school_id: school.id,
    action: 'create',
    entity_type: 'school',
    entity_id: school.id,
    new_values: school,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    data: school
  });
}));

// Update school
router.put('/schools/:id', [
  body('name').optional().trim().isLength({ min: 3 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('subscription_tier').optional().isIn(['basic', 'premium', 'enterprise']),
  body('status').optional().isIn(['active', 'suspended', 'trial', 'inactive'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  const existingSchool = await db('schools').where('id', id).first();
  if (!existingSchool) {
    return res.status(404).json({
      error: 'School not found'
    });
  }

  const [updatedSchool] = await db('schools')
    .where('id', id)
    .update({
      ...updateData,
      updated_at: new Date()
    })
    .returning('*');

  // Log the action
  await db('audit_logs').insert({
    user_id: req.user.id,
    school_id: id,
    action: 'update',
    entity_type: 'school',
    entity_id: id,
    old_values: existingSchool,
    new_values: updatedSchool,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  });

  res.json({
    success: true,
    data: updatedSchool
  });
}));

// Delete school (soft delete by changing status)
router.delete('/schools/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const school = await db('schools').where('id', id).first();
  if (!school) {
    return res.status(404).json({
      error: 'School not found'
    });
  }

  await db('schools')
    .where('id', id)
    .update({
      status: 'inactive',
      updated_at: new Date()
    });

  // Log the action
  await db('audit_logs').insert({
    user_id: req.user.id,
    school_id: id,
    action: 'delete',
    entity_type: 'school',
    entity_id: id,
    old_values: school,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'School deactivated successfully'
  });
}));

// System audit logs
router.get('/audit-logs', requirePermission('view_system_logs'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, school_id, action, entity_type } = req.query;
  const offset = (page - 1) * limit;

  let query = db('audit_logs')
    .select(
      'audit_logs.*',
      'users.first_name',
      'users.last_name',
      'users.email',
      'schools.name as school_name'
    )
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .leftJoin('schools', 'audit_logs.school_id', 'schools.id');

  // Apply filters
  if (school_id) query = query.where('audit_logs.school_id', school_id);
  if (action) query = query.where('audit_logs.action', action);
  if (entity_type) query = query.where('audit_logs.entity_type', entity_type);

  const logs = await query
    .orderBy('audit_logs.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const totalCount = await db('audit_logs')
    .count('id as count')
    .modify((queryBuilder) => {
      if (school_id) queryBuilder.where('school_id', school_id);
      if (action) queryBuilder.where('action', action);
      if (entity_type) queryBuilder.where('entity_type', entity_type);
    })
    .first();

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalCount.count),
      pages: Math.ceil(totalCount.count / limit)
    }
  });
}));

module.exports = router;