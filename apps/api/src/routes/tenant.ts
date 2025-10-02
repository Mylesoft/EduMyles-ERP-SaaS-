import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get current tenant info
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant;
  const anyTenant = (tenant || {}) as any;
  const settings = anyTenant.settings;
  const plan = anyTenant.plan;
  const { /* eslint-disable @typescript-eslint/no-unused-vars */ contactInfo, ...publicTenantInfo } = anyTenant;
  
  res.json({
    success: true,
    data: {
      ...publicTenantInfo,
      settings: settings ? {
        timezone: (settings as any).timezone,
        dateFormat: (settings as any).dateFormat,
        timeFormat: (settings as any).timeFormat,
        currency: (settings as any).currency,
        language: (settings as any).language,
      } : undefined,
      plan: plan ? {
        name: (plan as any).name,
        features: (plan as any).features,
      } : undefined,
    },
  });
}));

// Get tenant settings (requires auth)
router.get('/settings', 
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = req.tenant as any;
    
    res.json({
      success: true,
      data: {
        settings: tenant.settings,
        contactInfo: tenant.contactInfo,
        plan: tenant.plan,
      },
    });
  })
);

export default router;