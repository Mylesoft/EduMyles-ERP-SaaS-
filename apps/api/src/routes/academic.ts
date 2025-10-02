import { Router } from 'express';
import { body, query } from 'express-validator';
import { asyncHandler } from '../middleware/error-handler';
import { authMiddleware, requirePermission } from '../middleware/auth';
import {
  createAcademicYear,
  getAcademicYears,
  createSemester,
  createGrade,
  getGrades,
  createSubject,
  createClass,
  getClasses
} from '../controllers/academic';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Academic Years
router.get('/years',
  requirePermission(['academic:read', 'admin:all']),
  query('includeInactive').optional().isBoolean(),
  asyncHandler(getAcademicYears)
);

router.post('/years',
  requirePermission(['academic:create', 'admin:all']),
  body('name').notEmpty().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('isActive').optional().isBoolean(),
  asyncHandler(createAcademicYear)
);

// Semesters
router.post('/semesters',
  requirePermission(['academic:create', 'admin:all']),
  body('academicYearId').isUUID(),
  body('name').notEmpty().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('isActive').optional().isBoolean(),
  asyncHandler(createSemester)
);

// Grades
router.get('/grades',
  requirePermission(['academic:read', 'admin:all']),
  asyncHandler(getGrades)
);

router.post('/grades',
  requirePermission(['academic:create', 'admin:all']),
  body('name').notEmpty().trim(),
  body('level').isInt({ min: 0, max: 20 }),
  body('description').optional().isString(),
  asyncHandler(createGrade)
);

// Subjects
router.post('/subjects',
  requirePermission(['academic:create', 'admin:all']),
  body('gradeId').isUUID(),
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  body('description').optional().isString(),
  body('color').optional().isString(),
  body('credits').optional().isInt({ min: 0 }),
  asyncHandler(createSubject)
);

// Classes
router.get('/classes',
  requirePermission(['academic:read', 'admin:all']),
  query('gradeId').optional().isUUID(),
  query('semesterId').optional().isUUID(),
  asyncHandler(getClasses)
);

router.post('/classes',
  requirePermission(['academic:create', 'admin:all']),
  body('gradeId').isUUID(),
  body('semesterId').isUUID(),
  body('name').notEmpty().trim(),
  body('capacity').optional().isInt({ min: 1 }),
  asyncHandler(createClass)
);

export default router;