import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/error-handler';
import { authMiddleware } from '../middleware/auth';
import { login, register, refreshToken, logout, verifyToken } from '../controllers/auth';

const router = Router();

// Login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('tenantSubdomain').optional().isLength({ min: 1 }),
  asyncHandler(login)
);

// Register (if enabled)
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('tenantSubdomain').isLength({ min: 1 }),
  body('role').optional().isIn(['STUDENT', 'TEACHER', 'PARENT', 'STAFF']),
  asyncHandler(register)
);

// Refresh token
router.post('/refresh',
  body('refreshToken').notEmpty(),
  asyncHandler(refreshToken)
);

// Logout
router.post('/logout',
  asyncHandler(logout)
);

// Verify token (protected route)
router.get('/verify',
  authMiddleware,
  asyncHandler(verifyToken)
);

export default router;