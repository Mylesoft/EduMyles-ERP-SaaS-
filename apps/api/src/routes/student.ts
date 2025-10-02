import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/error-handler';
import { authMiddleware, requirePermission, requireRole } from '../middleware/auth';
import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  getAllStudents,
  deleteStudentProfile
} from '../controllers/student';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all students (paginated)
router.get('/',
  requirePermission(['student:read', 'admin:all']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('grade').optional().isString(),
  query('section').optional().isString(),
  query('sortBy').optional().isIn(['studentId', 'admissionDate', 'currentGrade', 'rollNumber']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  asyncHandler(getAllStudents)
);

// Create student profile
router.post('/users/:userId/profile',
  requirePermission(['student:create', 'admin:all']),
  param('userId').isUUID(),
  body('studentId').isString().isLength({ min: 1, max: 50 }),
  body('admissionDate').isISO8601(),
  body('currentGrade').isString().isLength({ min: 1, max: 20 }),
  body('section').optional().isString().isLength({ max: 10 }),
  body('rollNumber').optional().isString().isLength({ max: 20 }),
  body('medicalInfo').optional().isObject(),
  body('academicInfo').optional().isObject(),
  body('transportInfo').optional().isObject(),
  asyncHandler(createStudentProfile)
);

// Get student profile by user ID
router.get('/users/:userId/profile',
  requirePermission(['student:read', 'admin:all']),
  param('userId').isUUID(),
  asyncHandler(getStudentProfile)
);

// Update student profile
router.put('/users/:userId/profile',
  requirePermission(['student:update', 'admin:all']),
  param('userId').isUUID(),
  body('studentId').optional().isString().isLength({ min: 1, max: 50 }),
  body('admissionDate').optional().isISO8601(),
  body('graduationDate').optional().isISO8601(),
  body('currentGrade').optional().isString().isLength({ min: 1, max: 20 }),
  body('section').optional().isString().isLength({ max: 10 }),
  body('rollNumber').optional().isString().isLength({ max: 20 }),
  body('medicalInfo').optional().isObject(),
  body('academicInfo').optional().isObject(),
  body('transportInfo').optional().isObject(),
  asyncHandler(updateStudentProfile)
);

// Delete student profile
router.delete('/users/:userId/profile',
  requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'PRINCIPAL']),
  param('userId').isUUID(),
  asyncHandler(deleteStudentProfile)
);

export default router;