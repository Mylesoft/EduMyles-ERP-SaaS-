import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import { validatePermissions } from '../middleware/permissions';

const router = Router();
const prisma = new PrismaClient();

// Get dashboard overview statistics
router.get('/dashboard/overview', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['analytics:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { academicYearId } = req.query;
      
      const where: any = { tenantId };
      if (academicYearId) where.academicYearId = academicYearId;
      
      const [
        totalStudents,
        activeEnrollments,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalAssessments,
        pendingSubmissions,
        avgAttendanceRate,
        recentActivities
      ] = await Promise.all([
        prisma.studentProfile.count({ where: { tenantId } }),
        prisma.studentEnrollment.count({ 
          where: { ...where, status: 'ACTIVE' } 
        }),
        prisma.teacherProfile.count({ where: { tenantId } }),
        prisma.class.count({ where: { tenantId } }),
        prisma.subject.count({ where: { tenantId } }),
        prisma.assessment.count({ where: { tenantId } }),
        prisma.assessmentSubmission.count({ 
          where: { tenantId, manualReview: true } 
        }),
        // Calculate average attendance rate
        prisma.attendance.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { id: true },
        }),
        // Get recent activities
        prisma.auditLog.findMany({
          where: { tenantId },
          take: 10,
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            action: true,
            resource: true,
            timestamp: true,
          }
        })
      ]);
      
      // Calculate attendance rate
      const attendanceStats = avgAttendanceRate.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);
      
      const totalAttendanceRecords = Object.values(attendanceStats).reduce((sum, count) => sum + count, 0);
      const presentCount = attendanceStats.PRESENT || 0;
      const attendanceRate = totalAttendanceRecords > 0 
        ? Math.round((presentCount / totalAttendanceRecords) * 100) 
        : 0;
      
      res.json({
        success: true,
        data: {
          overview: {
            totalStudents,
            activeEnrollments,
            totalTeachers,
            totalClasses,
            totalSubjects,
            totalAssessments,
            pendingSubmissions,
            attendanceRate,
          },
          recentActivities,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch dashboard overview' 
      });
    }
  }
);

// Get enrollment analytics
router.get('/enrollment/trends', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['analytics:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { academicYearId, period = '30' } = req.query;
      
      const where: any = { tenantId };
      if (academicYearId) where.academicYearId = academicYearId;
      
      // Get enrollment trends over time
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(period));
      
      const enrollmentTrends = await prisma.studentEnrollment.groupBy({
        by: ['createdAt'],
        where: {
          ...where,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      
      // Get enrollment by grade
      const enrollmentsByGrade = await prisma.studentEnrollment.groupBy({
        by: ['gradeId'],
        where,
        _count: { id: true },
        include: {
          grade: {
            select: { name: true }
          }
        }
      });
      
      // Get enrollment status distribution
      const enrollmentsByStatus = await prisma.studentEnrollment.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      });
      
      res.json({
        success: true,
        data: {
          trends: enrollmentTrends.map(trend => ({
            date: trend.createdAt,
            count: trend._count.id
          })),
          byGrade: enrollmentsByGrade,
          byStatus: enrollmentsByStatus.map(item => ({
            status: item.status,
            count: item._count.id
          })),
        }
      });
    } catch (error) {
      console.error('Error fetching enrollment analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch enrollment analytics' 
      });
    }
  }
);

// Get attendance analytics
router.get('/attendance/trends', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['analytics:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { dateFrom, dateTo, classId, subjectId } = req.query;
      
      const where: any = { tenantId };
      
      if (classId) where.classId = classId;
      if (subjectId) where.subjectId = subjectId;
      
      // Date filtering
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(dateFrom as string);
        if (dateTo) where.date.lte = new Date(dateTo as string);
      }
      
      // Daily attendance trends
      const dailyAttendance = await prisma.attendance.groupBy({
        by: ['date', 'status'],
        where,
        _count: { id: true },
        orderBy: { date: 'asc' },
      });
      
      // Attendance by class
      const attendanceByClass = await prisma.attendance.groupBy({
        by: ['classId', 'status'],
        where,
        _count: { id: true },
      });
      
      // Top/bottom performing students (attendance wise)
      const studentAttendance = await prisma.attendance.groupBy({
        by: ['studentId'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          // This is a workaround - we'll calculate attendance rate in application logic
        }
      });
      
      // Process daily attendance data
      const processedDailyData = dailyAttendance.reduce((acc, record) => {
        const dateStr = record.date.toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr, present: 0, absent: 0, late: 0, excused: 0, halfDay: 0 };
        }
        
        const statusKey = record.status.toLowerCase().replace('_', '');
        if (statusKey === 'halfday') {
          acc[dateStr].halfDay = record._count.id;
        } else {
          acc[dateStr][statusKey as keyof typeof acc[typeof dateStr]] = record._count.id;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      res.json({
        success: true,
        data: {
          dailyTrends: Object.values(processedDailyData),
          byClass: attendanceByClass,
          studentStats: studentAttendance,
        }
      });
    } catch (error) {
      console.error('Error fetching attendance analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch attendance analytics' 
      });
    }
  }
);

// Get assessment performance analytics
router.get('/assessments/performance', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['analytics:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { subjectId, classId, assessmentType } = req.query;
      
      const where: any = { tenantId };
      if (subjectId) where.subjectId = subjectId;
      if (classId) where.classId = classId;
      if (assessmentType) where.assessmentType = assessmentType;
      
      // Assessment submission rates
      const assessments = await prisma.assessment.findMany({
        where,
        include: {
          _count: {
            select: {
              submissions: true
            }
          },
          class: {
            include: {
              _count: {
                select: {
                  enrollments: true
                }
              }
            }
          }
        }
      });
      
      // Average scores by subject
      const scoresBySubject = await prisma.assessmentSubmission.groupBy({
        by: ['assessment'],
        where: { 
          tenantId,
          score: { not: null },
          ...(subjectId && { assessment: { subjectId } })
        },
        _avg: { score: true },
        _count: { id: true },
      });
      
      // Grade distribution
      const gradeDistribution = await prisma.assessmentSubmission.findMany({
        where: { 
          tenantId, 
          score: { not: null },
          assessment: where
        },
        select: {
          score: true,
          percentage: true,
          assessment: {
            select: {
              totalMarks: true,
              passingMarks: true,
              subject: { select: { name: true } }
            }
          }
        }
      });
      
      // Process assessments data
      const assessmentStats = assessments.map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        submissionRate: assessment.class._count.enrollments > 0 
          ? Math.round((assessment._count.submissions / assessment.class._count.enrollments) * 100)
          : 0,
        totalSubmissions: assessment._count.submissions,
        expectedSubmissions: assessment.class._count.enrollments,
      }));
      
      // Process grade distribution
      const gradeRanges = {
        'A (90-100%)': 0,
        'B (80-89%)': 0,
        'C (70-79%)': 0,
        'D (60-69%)': 0,
        'F (0-59%)': 0,
      };
      
      gradeDistribution.forEach(submission => {
        const percentage = submission.percentage || 0;
        if (percentage >= 90) gradeRanges['A (90-100%)']++;
        else if (percentage >= 80) gradeRanges['B (80-89%)']++;
        else if (percentage >= 70) gradeRanges['C (70-79%)']++;
        else if (percentage >= 60) gradeRanges['D (60-69%)']++;
        else gradeRanges['F (0-59%)']++;
      });
      
      res.json({
        success: true,
        data: {
          assessmentStats,
          averageScores: scoresBySubject.map(item => ({
            assessment: item.assessment,
            averageScore: item._avg.score,
            submissionCount: item._count.id
          })),
          gradeDistribution: Object.entries(gradeRanges).map(([range, count]) => ({
            range,
            count
          })),
          totalSubmissions: gradeDistribution.length,
        }
      });
    } catch (error) {
      console.error('Error fetching assessment performance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch assessment performance analytics' 
      });
    }
  }
);

// Get student performance report
router.get('/students/:studentId/performance', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['analytics:read']),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { tenantId } = req.tenant!;
      const { academicYearId, semesterId } = req.query;
      
      // Get student info
      const student = await prisma.studentProfile.findFirst({
        where: { id: studentId, tenantId },
        include: {
          user: true
        }
      });
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }
      
      const where: any = { tenantId, studentId };
      if (academicYearId) where.academicYearId = academicYearId;
      if (semesterId) where.semesterId = semesterId;
      
      // Get attendance summary
      const attendanceWhere = { tenantId, studentId };
      const [
        totalAttendanceDays,
        presentDays,
        absentDays,
        lateDays
      ] = await Promise.all([
        prisma.attendance.count({ where: attendanceWhere }),
        prisma.attendance.count({ where: { ...attendanceWhere, status: 'PRESENT' } }),
        prisma.attendance.count({ where: { ...attendanceWhere, status: 'ABSENT' } }),
        prisma.attendance.count({ where: { ...attendanceWhere, status: 'LATE' } }),
      ]);
      
      // Get grade records
      const gradeRecords = await prisma.gradeRecord.findMany({
        where,
        include: {
          subject: true,
          assessment: true,
        },
        orderBy: { gradedAt: 'desc' },
      });
      
      // Get assessment submissions
      const submissions = await prisma.assessmentSubmission.findMany({
        where: { tenantId, studentId },
        include: {
          assessment: {
            include: {
              subject: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
      });
      
      // Calculate performance metrics
      const subjectPerformance = gradeRecords.reduce((acc, record) => {
        const subjectName = record.subject.name;
        if (!acc[subjectName]) {
          acc[subjectName] = {
            totalMarks: 0,
            obtainedMarks: 0,
            assessmentCount: 0,
            averagePercentage: 0,
          };
        }
        
        acc[subjectName].totalMarks += record.maxMarks;
        acc[subjectName].obtainedMarks += record.obtainedMarks;
        acc[subjectName].assessmentCount++;
        
        return acc;
      }, {} as Record<string, any>);
      
      // Calculate average percentages
      Object.keys(subjectPerformance).forEach(subject => {
        const perf = subjectPerformance[subject];
        perf.averagePercentage = perf.totalMarks > 0 
          ? Math.round((perf.obtainedMarks / perf.totalMarks) * 100)
          : 0;
      });
      
      const attendancePercentage = totalAttendanceDays > 0 
        ? Math.round((presentDays / totalAttendanceDays) * 100)
        : 0;
      
      res.json({
        success: true,
        data: {
          student: {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            studentId: student.studentId,
          },
          attendance: {
            totalDays: totalAttendanceDays,
            presentDays,
            absentDays,
            lateDays,
            percentage: attendancePercentage,
          },
          academic: {
            totalAssessments: submissions.length,
            gradedAssessments: submissions.filter(s => s.score !== null).length,
            averageScore: submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length || 0,
            subjectPerformance: Object.entries(subjectPerformance).map(([subject, perf]) => ({
              subject,
              ...perf
            })),
          },
          recentGrades: gradeRecords.slice(0, 10),
          recentSubmissions: submissions.slice(0, 10),
        }
      });
    } catch (error) {
      console.error('Error fetching student performance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch student performance' 
      });
    }
  }
);

// Export data for reports
router.get('/reports/export', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['analytics:export']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { type, format = 'json', ...filters } = req.query;
      
      let data;
      
      switch (type) {
        case 'enrollment':
          data = await prisma.studentEnrollment.findMany({
            where: { tenantId, ...filters },
            include: {
              student: { include: { user: true } },
              grade: true,
              class: true,
              academicYear: true,
            },
          });
          break;
          
        case 'attendance':
          data = await prisma.attendance.findMany({
            where: { tenantId, ...filters },
            include: {
              student: { include: { user: true } },
              class: true,
              subject: true,
            },
          });
          break;
          
        case 'assessments':
          data = await prisma.assessmentSubmission.findMany({
            where: { tenantId, ...filters },
            include: {
              student: { include: { user: true } },
              assessment: {
                include: {
                  subject: true,
                  class: true,
                }
              }
            },
          });
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid report type'
          });
      }
      
      if (format === 'csv') {
        // Convert to CSV format
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
        // Implementation for CSV conversion would go here
        res.send('CSV export not yet implemented');
      } else {
        res.json({
          success: true,
          data,
          meta: {
            type,
            count: data.length,
            exportedAt: new Date().toISOString(),
          }
        });
      }
    } catch (error) {
      console.error('Error exporting report data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export report data' 
      });
    }
  }
);

export default router;