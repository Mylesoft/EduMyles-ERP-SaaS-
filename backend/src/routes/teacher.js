const express = require('express');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('teacher'));

router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Teacher Dashboard - Coming Soon', tenant: req.tenant });
});

router.get('/classes', (req, res) => {
  res.json({ success: true, message: 'Class Management - Coming Soon', tenant: req.tenant });
});

router.get('/assignments', (req, res) => {
  res.json({ success: true, message: 'Assignment Center - Coming Soon', tenant: req.tenant });
});

module.exports = router;