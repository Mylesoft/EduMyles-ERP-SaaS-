import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import { validatePermissions } from '../middleware/permissions';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const enrollmentCreateSchema = z.object({
  studentId: z.string(),
  academicYearId: z.string(),
  gradeId: z.string(),
  classId: z.string(),
  admissionNumber: z.string(),
  admissionDate: z.string().transform((date) => new Date(date)),
  previousSchool: z.string().optional(),
  transferCertificate: z.string().optional(),
  medicalInfo: z.object({}).optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string().optional(),
  })).default([]),
});

const enrollmentUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED']).optional(),
  previousSchool: z.string().optional(),
  transferCertificate: z.string().optional(),
  medicalInfo: z.object({}).optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    address: z.string().optional(),
  })).optional(),
});

// Get all enrollments for a tenant
router.get('/', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['enrollment:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { page = 1, limit = 50, status, gradeId, classId, academicYearId } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = { tenantId };
      
      if (status) where.status = status;
      if (gradeId) where.gradeId = gradeId;
      if (classId) where.classId = classId;
      if (academicYearId) where.academicYearId = academicYearId;
      
      const [enrollments, total] = await Promise.all([
        prisma.studentEnrollment.findMany({
          where,
          include: {
            student: {
              include: {
                userId: true
              }
            },
            academicYear: true,
            grade: true,
            class: true,
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.studentEnrollment.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: enrollments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch enrollments' 
      });
    }
  }
);

// Get enrollment by ID
router.get('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['enrollment:read']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: { id, tenantId },
        include: {
          student: {
            include: {
              userId: true
            }
          },
          academicYear: true,
          grade: true,
          class: true,
        },
      });
      
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Enrollment not found'
        });
      }
      
      res.json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch enrollment' 
      });
    }
  }
);

// Create new enrollment
router.post('/', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['enrollment:create']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const validatedData = enrollmentCreateSchema.parse(req.body);
      
      // Check if student is already enrolled for the academic year
      const existingEnrollment = await prisma.studentEnrollment.findFirst({
        where: {
          tenantId,
          studentId: validatedData.studentId,
          academicYearId: validatedData.academicYearId,
        },
      });
      
      if (existingEnrollment) {
        return res.status(400).json({
          success: false,
          error: 'Student is already enrolled for this academic year'
        });
      }
      
      // Check if admission number is unique
      const existingAdmissionNumber = await prisma.studentEnrollment.findFirst({
        where: {
          tenantId,
          admissionNumber: validatedData.admissionNumber,
        },
      });
      
      if (existingAdmissionNumber) {
        return res.status(400).json({
          success: false,
          error: 'Admission number already exists'
        });
      }
      
      const enrollment = await prisma.studentEnrollment.create({
        data: {
          tenantId,
          ...validatedData,
        },
        include: {
          student: {
            include: {
              userId: true
            }
          },
          academicYear: true,
          grade: true,
          class: true,
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'StudentEnrollment',
          resourceId: enrollment.id,
          newValues: enrollment,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.status(201).json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error creating enrollment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create enrollment' 
      });
    }
  }
);

// Update enrollment
router.put('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['enrollment:update']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      const validatedData = enrollmentUpdateSchema.parse(req.body);
      
      // Get existing enrollment for audit log
      const existingEnrollment = await prisma.studentEnrollment.findFirst({
        where: { id, tenantId },
      });
      
      if (!existingEnrollment) {
        return res.status(404).json({
          success: false,
          error: 'Enrollment not found'
        });
      }
      
      const updatedEnrollment = await prisma.studentEnrollment.update({
        where: { id },
        data: validatedData,
        include: {
          student: {
            include: {
              userId: true
            }
          },
          academicYear: true,
          grade: true,
          class: true,
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'StudentEnrollment',
          resourceId: id,
          oldValues: existingEnrollment,
          newValues: updatedEnrollment,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        data: updatedEnrollment
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error updating enrollment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update enrollment' 
      });
    }
  }
);

// Delete enrollment (soft delete by setting status to INACTIVE)
router.delete('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['enrollment:delete']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      
      const existingEnrollment = await prisma.studentEnrollment.findFirst({
        where: { id, tenantId },
      });
      
      if (!existingEnrollment) {
        return res.status(404).json({
          success: false,
          error: 'Enrollment not found'
        });
      }
      
      const updatedEnrollment = await prisma.studentEnrollment.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'StudentEnrollment',
          resourceId: id,
          oldValues: existingEnrollment,
          newValues: updatedEnrollment,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        message: 'Enrollment deactivated successfully'
      });
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete enrollment' 
      });
    }
  }
);

// Get enrollment statistics
router.get('/stats/overview', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['enrollment:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { academicYearId } = req.query;
      
      const where: any = { tenantId };
      if (academicYearId) where.academicYearId = academicYearId;
      
      const [
        totalEnrollments,
        activeEnrollments,
        inactiveEnrollments,
        transferredEnrollments,
        graduatedEnrollments,
        enrollmentsByGrade,
        enrollmentsByClass
      ] = await Promise.all([
        prisma.studentEnrollment.count({ where }),
        prisma.studentEnrollment.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.studentEnrollment.count({ where: { ...where, status: 'INACTIVE' } }),
        prisma.studentEnrollment.count({ where: { ...where, status: 'TRANSFERRED' } }),
        prisma.studentEnrollment.count({ where: { ...where, status: 'GRADUATED' } }),
        prisma.studentEnrollment.groupBy({
          by: ['gradeId'],
          where,
          _count: { id: true },
        }),
        prisma.studentEnrollment.groupBy({
          by: ['classId'],
          where,
          _count: { id: true },
        }),
      ]);
      
      res.json({
        success: true,
        data: {
          overview: {
            total: totalEnrollments,
            active: activeEnrollments,
            inactive: inactiveEnrollments,
            transferred: transferredEnrollments,
            graduated: graduatedEnrollments,
          },
          byGrade: enrollmentsByGrade,
          byClass: enrollmentsByClass,
        }
      });
    } catch (error) {
      console.error('Error fetching enrollment statistics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch enrollment statistics' 
      });
    }
  }
);

// Bulk enrollment update
router.put('/bulk/update', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['enrollment:update']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { enrollmentIds, updates } = req.body;
      
      if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid enrollment IDs'
        });
      }
      
      const validatedUpdates = enrollmentUpdateSchema.parse(updates);
      
      const updatedEnrollments = await prisma.studentEnrollment.updateMany({
        where: {
          id: { in: enrollmentIds },
          tenantId,
        },
        data: validatedUpdates,
      });
      
      // Create audit log for bulk update
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'BULK_UPDATE',
          resource: 'StudentEnrollment',
          resourceId: `bulk-${enrollmentIds.length}`,
          newValues: { enrollmentIds, updates: validatedUpdates },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        data: {
          updated: updatedEnrollments.count
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error bulk updating enrollments:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to bulk update enrollments' 
      });
    }
  }
);

export default router;