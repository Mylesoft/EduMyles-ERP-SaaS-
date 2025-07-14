const express = require('express');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('parent'));

router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Parent Dashboard - Coming Soon', tenant: req.tenant });
});

router.get('/children', (req, res) => {
  res.json({ success: true, message: 'Children Overview - Coming Soon', tenant: req.tenant });
});

router.get('/payments', (req, res) => {
  res.json({ success: true, message: 'Fee Payments - Coming Soon', tenant: req.tenant });
});

module.exports = router;