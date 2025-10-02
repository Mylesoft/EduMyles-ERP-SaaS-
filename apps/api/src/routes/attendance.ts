import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import { validatePermissions } from '../middleware/permissions';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const attendanceCreateSchema = z.object({
  studentId: z.string(),
  classId: z.string(),
  subjectId: z.string().optional(),
  date: z.string().transform((date) => new Date(date)),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY']),
  timeIn: z.string().transform((time) => new Date(time)).optional(),
  timeOut: z.string().transform((time) => new Date(time)).optional(),
  remarks: z.string().optional(),
});

const attendanceUpdateSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY']).optional(),
  timeIn: z.string().transform((time) => new Date(time)).optional(),
  timeOut: z.string().transform((time) => new Date(time)).optional(),
  remarks: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  date: z.string().transform((date) => new Date(date)),
  classId: z.string(),
  subjectId: z.string().optional(),
  attendance: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY']),
    timeIn: z.string().transform((time) => new Date(time)).optional(),
    timeOut: z.string().transform((time) => new Date(time)).optional(),
    remarks: z.string().optional(),
  })),
});

// Get attendance records
router.get('/', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { 
        page = 1, 
        limit = 50, 
        studentId, 
        classId, 
        subjectId, 
        date, 
        dateFrom, 
        dateTo,
        status 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = { tenantId };
      
      if (studentId) where.studentId = studentId;
      if (classId) where.classId = classId;
      if (subjectId) where.subjectId = subjectId;
      if (status) where.status = status;
      
      // Handle date filtering
      if (date) {
        const targetDate = new Date(date as string);
        where.date = targetDate;
      } else if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(dateFrom as string);
        if (dateTo) where.date.lte = new Date(dateTo as string);
      }
      
      const [attendance, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          include: {
            student: {
              include: {
                userId: true
              }
            },
            class: true,
            subject: true,
          },
          skip,
          take: Number(limit),
          orderBy: { date: 'desc' },
        }),
        prisma.attendance.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: attendance,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch attendance records' 
      });
    }
  }
);

// Get attendance by ID
router.get('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:read']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      
      const attendance = await prisma.attendance.findFirst({
        where: { id, tenantId },
        include: {
          student: {
            include: {
              userId: true
            }
          },
          class: true,
          subject: true,
        },
      });
      
      if (!attendance) {
        return res.status(404).json({
          success: false,
          error: 'Attendance record not found'
        });
      }
      
      res.json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch attendance record' 
      });
    }
  }
);

// Create attendance record
router.post('/', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:create']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const validatedData = attendanceCreateSchema.parse(req.body);
      
      // Check if attendance already exists for this student, date, and subject
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          tenantId,
          studentId: validatedData.studentId,
          date: validatedData.date,
          subjectId: validatedData.subjectId || null,
        },
      });
      
      if (existingAttendance) {
        return res.status(400).json({
          success: false,
          error: 'Attendance already recorded for this student and date'
        });
      }
      
      const attendance = await prisma.attendance.create({
        data: {
          tenantId,
          markedByUserId: req.user!.id,
          ...validatedData,
        },
        include: {
          student: {
            include: {
              userId: true
            }
          },
          class: true,
          subject: true,
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'Attendance',
          resourceId: attendance.id,
          newValues: attendance,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.status(201).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error creating attendance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create attendance record' 
      });
    }
  }
);

// Update attendance record
router.put('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:update']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      const validatedData = attendanceUpdateSchema.parse(req.body);
      
      const existingAttendance = await prisma.attendance.findFirst({
        where: { id, tenantId },
      });
      
      if (!existingAttendance) {
        return res.status(404).json({
          success: false,
          error: 'Attendance record not found'
        });
      }
      
      const updatedAttendance = await prisma.attendance.update({
        where: { id },
        data: validatedData,
        include: {
          student: {
            include: {
              userId: true
            }
          },
          class: true,
          subject: true,
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'Attendance',
          resourceId: id,
          oldValues: existingAttendance,
          newValues: updatedAttendance,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        data: updatedAttendance
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error updating attendance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update attendance record' 
      });
    }
  }
);

// Delete attendance record
router.delete('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:delete']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      
      const existingAttendance = await prisma.attendance.findFirst({
        where: { id, tenantId },
      });
      
      if (!existingAttendance) {
        return res.status(404).json({
          success: false,
          error: 'Attendance record not found'
        });
      }
      
      await prisma.attendance.delete({
        where: { id },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'Attendance',
          resourceId: id,
          oldValues: existingAttendance,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete attendance record' 
      });
    }
  }
);

// Bulk attendance marking
router.post('/bulk', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:create']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const validatedData = bulkAttendanceSchema.parse(req.body);
      
      const results = [];
      const errors = [];
      
      for (const attendanceRecord of validatedData.attendance) {
        try {
          // Check if attendance already exists
          const existingAttendance = await prisma.attendance.findFirst({
            where: {
              tenantId,
              studentId: attendanceRecord.studentId,
              date: validatedData.date,
              subjectId: validatedData.subjectId || null,
            },
          });
          
          let attendance;
          if (existingAttendance) {
            // Update existing record
            attendance = await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: {
                status: attendanceRecord.status,
                timeIn: attendanceRecord.timeIn,
                timeOut: attendanceRecord.timeOut,
                remarks: attendanceRecord.remarks,
              },
              include: {
                student: {
                  include: {
                    userId: true
                  }
                },
              },
            });
          } else {
            // Create new record
            attendance = await prisma.attendance.create({
              data: {
                tenantId,
                classId: validatedData.classId,
                subjectId: validatedData.subjectId,
                date: validatedData.date,
                markedByUserId: req.user!.id,
                ...attendanceRecord,
              },
              include: {
                student: {
                  include: {
                    userId: true
                  }
                },
              },
            });
          }
          
          results.push(attendance);
        } catch (error) {
          errors.push({
            studentId: attendanceRecord.studentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Create audit log for bulk operation
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'BULK_CREATE',
          resource: 'Attendance',
          resourceId: `bulk-${validatedData.date.toISOString().split('T')[0]}`,
          newValues: {
            date: validatedData.date,
            classId: validatedData.classId,
            subjectId: validatedData.subjectId,
            recordsCreated: results.length,
            errors: errors.length,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.status(201).json({
        success: true,
        data: {
          created: results.length,
          errors: errors.length,
          records: results,
          failedRecords: errors,
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
      
      console.error('Error creating bulk attendance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create bulk attendance records' 
      });
    }
  }
);

// Get attendance summary for a student
router.get('/student/:studentId/summary', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:read']),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { tenantId } = req.tenant!;
      const { dateFrom, dateTo, subjectId } = req.query;
      
      const where: any = { tenantId, studentId };
      
      if (subjectId) where.subjectId = subjectId;
      
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(dateFrom as string);
        if (dateTo) where.date.lte = new Date(dateTo as string);
      }
      
      const [
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        halfDays,
        attendanceBySubject
      ] = await Promise.all([
        prisma.attendance.count({ where }),
        prisma.attendance.count({ where: { ...where, status: 'PRESENT' } }),
        prisma.attendance.count({ where: { ...where, status: 'ABSENT' } }),
        prisma.attendance.count({ where: { ...where, status: 'LATE' } }),
        prisma.attendance.count({ where: { ...where, status: 'EXCUSED' } }),
        prisma.attendance.count({ where: { ...where, status: 'HALF_DAY' } }),
        prisma.attendance.groupBy({
          by: ['subjectId', 'status'],
          where,
          _count: { id: true },
        }),
      ]);
      
      const attendancePercentage = totalDays > 0 
        ? Math.round(((presentDays + halfDays * 0.5) / totalDays) * 100) 
        : 0;
      
      res.json({
        success: true,
        data: {
          summary: {
            totalDays,
            presentDays,
            absentDays,
            lateDays,
            excusedDays,
            halfDays,
            attendancePercentage,
          },
          bySubject: attendanceBySubject,
        }
      });
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch attendance summary' 
      });
    }
  }
);

// Get attendance report for a class
router.get('/class/:classId/report', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['attendance:read']),
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { tenantId } = req.tenant!;
      const { date, subjectId } = req.query;
      
      const where: any = { tenantId, classId };
      
      if (date) where.date = new Date(date as string);
      if (subjectId) where.subjectId = subjectId;
      
      const attendance = await prisma.attendance.findMany({
        where,
        include: {
          student: {
            include: {
              userId: true
            }
          },
          subject: true,
        },
        orderBy: [
          { date: 'desc' },
          { student: { userId: { firstName: 'asc' } } }
        ],
      });
      
      // Get attendance statistics
      const stats = await prisma.attendance.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      });
      
      const statsMap = stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        success: true,
        data: {
          attendance,
          statistics: {
            total: attendance.length,
            present: statsMap.PRESENT || 0,
            absent: statsMap.ABSENT || 0,
            late: statsMap.LATE || 0,
            excused: statsMap.EXCUSED || 0,
            halfDay: statsMap.HALF_DAY || 0,
          }
        }
      });
    } catch (error) {
      console.error('Error fetching class attendance report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch class attendance report' 
      });
    }
  }
);

export default router;