import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Get installed modules
router.get('/installed', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Module endpoints - implementation coming soon',
    data: []
  });
}));

// Get available modules (marketplace)
router.get('/available', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Module marketplace - implementation coming soon',
    data: []
  });
}));

export default router;