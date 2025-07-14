const jwt = require('jsonwebtoken');
const db = require('../database/connection');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details with school and roles
    const user = await db('users')
      .select(
        'users.*',
        'schools.name as school_name',
        'schools.code as school_code',
        'schools.status as school_status'
      )
      .leftJoin('schools', 'users.school_id', 'schools.id')
      .where('users.id', decoded.userId)
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended'
      });
    }

    // Get user roles and permissions
    const userRoles = await db('user_roles')
      .select(
        'roles.id',
        'roles.name',
        'roles.slug',
        'roles.permissions'
      )
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id);

    // Combine all permissions
    const permissions = new Set();
    userRoles.forEach(role => {
      const rolePermissions = JSON.parse(role.permissions || '[]');
      rolePermissions.forEach(permission => permissions.add(permission));
    });

    // Attach user info to request
    req.user = {
      ...user,
      roles: userRoles,
      permissions: Array.from(permissions)
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Authentication failed'
    });
  }
};

// Permission checking middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`
      });
    }

    next();
  };
};

// Role checking middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRoles = req.user.roles.map(r => r.slug);
    if (!userRoles.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role '${role}' required`
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requirePermission,
  requireRole
};