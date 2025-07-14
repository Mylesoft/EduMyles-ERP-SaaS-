const express = require('express');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('student'));

router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Student Dashboard - Coming Soon', tenant: req.tenant });
});

router.get('/assignments', (req, res) => {
  res.json({ success: true, message: 'Student Assignments - Coming Soon', tenant: req.tenant });
});

router.get('/grades', (req, res) => {
  res.json({ success: true, message: 'Student Grades - Coming Soon', tenant: req.tenant });
});

module.exports = router;