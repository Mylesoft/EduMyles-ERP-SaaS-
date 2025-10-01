const express = require('express');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('alumni'));

router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Alumni Dashboard - Coming Soon', tenant: req.tenant });
});

router.get('/network', (req, res) => {
  res.json({ success: true, message: 'Alumni Network - Coming Soon', tenant: req.tenant });
});

router.get('/events', (req, res) => {
  res.json({ success: true, message: 'Alumni Events - Coming Soon', tenant: req.tenant });
});

module.exports = router;