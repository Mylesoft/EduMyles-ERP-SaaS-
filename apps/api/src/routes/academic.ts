import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';

const router = Router();

// Get academic years
router.get('/years', 
  requirePermission('academic:read'),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Academic endpoints - implementation coming soon',
      data: []
    });
  })
);

export default router;