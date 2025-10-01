import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get current tenant info
router.get('/info', asyncHandler(async (req, res) => {
  const tenant = req.tenant;
  
  // Remove sensitive information
  const { settings, contactInfo, plan, ...publicTenantInfo } = tenant;
  
  res.json({
    success: true,
    data: {
      ...publicTenantInfo,
      settings: {
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        currency: settings.currency,
        language: settings.language,
      },
      plan: {
        name: plan.name,
        features: plan.features,
      },
    },
  });
}));

// Get tenant settings (requires auth)
router.get('/settings', 
  authMiddleware,
  asyncHandler(async (req, res) => {
    const tenant = req.tenant;
    
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