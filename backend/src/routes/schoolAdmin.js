const express = require('express');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure school admin access
router.use(requireRole('school-admin'));

// Placeholder routes for School Admin Portal
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'School Admin Dashboard - Coming Soon',
    tenant: req.tenant
  });
});

router.get('/students', (req, res) => {
  res.json({
    success: true,
    message: 'Student Management - Coming Soon',
    tenant: req.tenant
  });
});

router.get('/staff', (req, res) => {
  res.json({
    success: true,
    message: 'Staff Management - Coming Soon',
    tenant: req.tenant
  });
});

router.get('/academics', (req, res) => {
  res.json({
    success: true,
    message: 'Academic Management - Coming Soon',
    tenant: req.tenant
  });
});

router.get('/finances', (req, res) => {
  res.json({
    success: true,
    message: 'Financial Management - Coming Soon',
    tenant: req.tenant
  });
});

module.exports = router;