import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Get current user profile
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'User endpoints - implementation coming soon',
    data: req.user || null
  });
}));

export default router;