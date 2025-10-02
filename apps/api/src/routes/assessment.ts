import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import { validatePermissions } from '../middleware/permissions';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const assessmentCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  assessmentType: z.enum(['QUIZ', 'ASSIGNMENT', 'MIDTERM_EXAM', 'FINAL_EXAM', 'PROJECT', 'PRACTICAL', 'ORAL']),
  subjectId: z.string(),
  classId: z.string(),
  totalMarks: z.number().positive(),
  passingMarks: z.number().positive(),
  duration: z.number().positive().optional(),
  instructions: z.string().optional(),
  scheduledDate: z.string().transform((date) => new Date(date)).optional(),
  startTime: z.string().transform((time) => new Date(time)).optional(),
  endTime: z.string().transform((time) => new Date(time)).optional(),
});

const assessmentUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  totalMarks: z.number().positive().optional(),
  passingMarks: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  instructions: z.string().optional(),
  scheduledDate: z.string().transform((date) => new Date(date)).optional(),
  startTime: z.string().transform((time) => new Date(time)).optional(),
  endTime: z.string().transform((time) => new Date(time)).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

const questionCreateSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK', 'MATCHING']),
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean().optional(),
  })).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number().positive().default(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  explanation: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const submissionCreateSchema = z.object({
  answers: z.record(z.string(), z.any()),
});

// Get all assessments
router.get('/', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:read']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const { 
        page = 1, 
        limit = 50, 
        subjectId, 
        classId, 
        assessmentType, 
        status,
        createdByUserId 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = { tenantId };
      
      if (subjectId) where.subjectId = subjectId;
      if (classId) where.classId = classId;
      if (assessmentType) where.assessmentType = assessmentType;
      if (status) where.status = status;
      if (createdByUserId) where.createdByUserId = createdByUserId;
      
      const [assessments, total] = await Promise.all([
        prisma.assessment.findMany({
          where,
          include: {
            subject: true,
            class: true,
            questions: {
              select: {
                id: true,
                type: true,
                marks: true,
                difficulty: true,
              }
            },
            _count: {
              select: {
                questions: true,
                submissions: true,
              }
            }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.assessment.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: assessments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching assessments:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch assessments' 
      });
    }
  }
);

// Get assessment by ID
router.get('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:read']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      
      const assessment = await prisma.assessment.findFirst({
        where: { id, tenantId },
        include: {
          subject: true,
          class: true,
          questions: {
            orderBy: { createdAt: 'asc' }
          },
          submissions: {
            include: {
              student: {
                include: {
                  user: true
                }
              }
            }
          },
          _count: {
            select: {
              questions: true,
              submissions: true,
            }
          }
        },
      });
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }
      
      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      console.error('Error fetching assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch assessment' 
      });
    }
  }
);

// Create new assessment
router.post('/', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:create']),
  async (req, res) => {
    try {
      const { tenantId } = req.tenant!;
      const validatedData = assessmentCreateSchema.parse(req.body);
      
      const assessment = await prisma.assessment.create({
        data: {
          tenantId,
          createdByUserId: req.user!.id,
          ...validatedData,
        },
        include: {
          subject: true,
          class: true,
          _count: {
            select: {
              questions: true,
              submissions: true,
            }
          }
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'Assessment',
          resourceId: assessment.id,
          newValues: assessment,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.status(201).json({
        success: true,
        data: assessment
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error creating assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create assessment' 
      });
    }
  }
);

// Update assessment
router.put('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:update']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      const validatedData = assessmentUpdateSchema.parse(req.body);
      
      const existingAssessment = await prisma.assessment.findFirst({
        where: { id, tenantId },
      });
      
      if (!existingAssessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }
      
      const updatedAssessment = await prisma.assessment.update({
        where: { id },
        data: validatedData,
        include: {
          subject: true,
          class: true,
          _count: {
            select: {
              questions: true,
              submissions: true,
            }
          }
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'Assessment',
          resourceId: id,
          oldValues: existingAssessment,
          newValues: updatedAssessment,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        data: updatedAssessment
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error updating assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update assessment' 
      });
    }
  }
);

// Delete assessment
router.delete('/:id', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:delete']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantId } = req.tenant!;
      
      const existingAssessment = await prisma.assessment.findFirst({
        where: { id, tenantId },
      });
      
      if (!existingAssessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }
      
      // Check if assessment has submissions
      const submissionCount = await prisma.assessmentSubmission.count({
        where: { assessmentId: id, tenantId },
      });
      
      if (submissionCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete assessment with existing submissions'
        });
      }
      
      await prisma.assessment.delete({
        where: { id },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'Assessment',
          resourceId: id,
          oldValues: existingAssessment,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        message: 'Assessment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete assessment' 
      });
    }
  }
);

// Add question to assessment
router.post('/:id/questions', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:update']),
  async (req, res) => {
    try {
      const { id: assessmentId } = req.params;
      const { tenantId } = req.tenant!;
      const validatedData = questionCreateSchema.parse(req.body);
      
      // Check if assessment exists and belongs to tenant
      const assessment = await prisma.assessment.findFirst({
        where: { id: assessmentId, tenantId },
      });
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }
      
      const question = await prisma.question.create({
        data: {
          tenantId,
          assessmentId,
          createdByUserId: req.user!.id,
          ...validatedData,
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'Question',
          resourceId: question.id,
          newValues: question,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.status(201).json({
        success: true,
        data: question
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error creating question:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create question' 
      });
    }
  }
);

// Update question
router.put('/:assessmentId/questions/:questionId', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:update']),
  async (req, res) => {
    try {
      const { assessmentId, questionId } = req.params;
      const { tenantId } = req.tenant!;
      const validatedData = questionCreateSchema.partial().parse(req.body);
      
      const existingQuestion = await prisma.question.findFirst({
        where: { 
          id: questionId, 
          assessmentId, 
          tenantId 
        },
      });
      
      if (!existingQuestion) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }
      
      const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
        data: validatedData,
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'Question',
          resourceId: questionId,
          oldValues: existingQuestion,
          newValues: updatedQuestion,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        data: updatedQuestion
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error updating question:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update question' 
      });
    }
  }
);

// Delete question
router.delete('/:assessmentId/questions/:questionId', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:update']),
  async (req, res) => {
    try {
      const { assessmentId, questionId } = req.params;
      const { tenantId } = req.tenant!;
      
      const existingQuestion = await prisma.question.findFirst({
        where: { 
          id: questionId, 
          assessmentId, 
          tenantId 
        },
      });
      
      if (!existingQuestion) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }
      
      await prisma.question.delete({
        where: { id: questionId },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'Question',
          resourceId: questionId,
          oldValues: existingQuestion,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete question' 
      });
    }
  }
);

// Submit assessment (student submission)
router.post('/:id/submit', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:submit']),
  async (req, res) => {
    try {
      const { id: assessmentId } = req.params;
      const { tenantId } = req.tenant!;
      const validatedData = submissionCreateSchema.parse(req.body);
      
      // Check if assessment exists and is active
      const assessment = await prisma.assessment.findFirst({
        where: { 
          id: assessmentId, 
          tenantId,
          status: 'ACTIVE'
        },
        include: {
          questions: true
        }
      });
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found or not active'
        });
      }
      
      // Get student profile
      const studentProfile = await prisma.studentProfile.findFirst({
        where: { userId: req.user!.id, tenantId },
      });
      
      if (!studentProfile) {
        return res.status(403).json({
          success: false,
          error: 'Student profile not found'
        });
      }
      
      // Check if already submitted
      const existingSubmission = await prisma.assessmentSubmission.findFirst({
        where: {
          assessmentId,
          studentId: studentProfile.id,
          tenantId,
        },
      });
      
      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          error: 'Assessment already submitted'
        });
      }
      
      // Calculate auto-graded score for objective questions
      let autoScore = 0;
      let totalAutoGradableMarks = 0;
      const gradableQuestions = assessment.questions.filter(q => 
        ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK'].includes(q.type)
      );
      
      for (const question of gradableQuestions) {
        totalAutoGradableMarks += question.marks;
        const studentAnswer = validatedData.answers[question.id];
        if (studentAnswer === question.correctAnswer) {
          autoScore += question.marks;
        }
      }
      
      const autoGraded = gradableQuestions.length > 0;
      const percentage = autoGraded && totalAutoGradableMarks > 0 
        ? Math.round((autoScore / totalAutoGradableMarks) * 100) 
        : undefined;
      
      const submission = await prisma.assessmentSubmission.create({
        data: {
          tenantId,
          assessmentId,
          studentId: studentProfile.id,
          answers: validatedData.answers,
          score: autoGraded ? autoScore : undefined,
          percentage,
          submittedAt: new Date(),
          autoGraded,
          manualReview: !autoGraded || gradableQuestions.length < assessment.questions.length,
        },
        include: {
          assessment: {
            include: {
              subject: true,
              class: true,
            }
          },
          student: {
            include: {
              user: true
            }
          }
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'AssessmentSubmission',
          resourceId: submission.id,
          newValues: submission,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.status(201).json({
        success: true,
        data: submission
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Error submitting assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to submit assessment' 
      });
    }
  }
);

// Get assessment submissions (for teachers)
router.get('/:id/submissions', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:read']),
  async (req, res) => {
    try {
      const { id: assessmentId } = req.params;
      const { tenantId } = req.tenant!;
      const { page = 1, limit = 50, needsReview } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = { tenantId, assessmentId };
      
      if (needsReview === 'true') {
        where.manualReview = true;
      }
      
      const [submissions, total] = await Promise.all([
        prisma.assessmentSubmission.findMany({
          where,
          include: {
            student: {
              include: {
                user: true
              }
            },
            assessment: {
              include: {
                subject: true,
                class: true,
              }
            }
          },
          skip,
          take: Number(limit),
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.assessmentSubmission.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: submissions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch submissions' 
      });
    }
  }
);

// Grade submission manually
router.put('/submissions/:submissionId/grade', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:grade']),
  async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { tenantId } = req.tenant!;
      const { score, percentage, feedback } = req.body;
      
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid score is required'
        });
      }
      
      const existingSubmission = await prisma.assessmentSubmission.findFirst({
        where: { id: submissionId, tenantId },
      });
      
      if (!existingSubmission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
      }
      
      const updatedSubmission = await prisma.assessmentSubmission.update({
        where: { id: submissionId },
        data: {
          score,
          percentage: percentage || Math.round((score / 100) * 100),
          feedback,
          manualReview: false,
        },
        include: {
          student: {
            include: {
              user: true
            }
          },
          assessment: {
            include: {
              subject: true,
              class: true,
            }
          }
        },
      });
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'AssessmentSubmission',
          resourceId: submissionId,
          oldValues: existingSubmission,
          newValues: updatedSubmission,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
      
      res.json({
        success: true,
        data: updatedSubmission
      });
    } catch (error) {
      console.error('Error grading submission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to grade submission' 
      });
    }
  }
);

// Get assessment statistics
router.get('/:id/stats', 
  authenticateToken, 
  validateTenant, 
  validatePermissions(['assessment:read']),
  async (req, res) => {
    try {
      const { id: assessmentId } = req.params;
      const { tenantId } = req.tenant!;
      
      const [
        assessment,
        totalSubmissions,
        gradedSubmissions,
        pendingReview,
        averageScore,
        scoreDistribution
      ] = await Promise.all([
        prisma.assessment.findFirst({
          where: { id: assessmentId, tenantId },
          include: { class: true, subject: true }
        }),
        prisma.assessmentSubmission.count({
          where: { assessmentId, tenantId }
        }),
        prisma.assessmentSubmission.count({
          where: { assessmentId, tenantId, score: { not: null } }
        }),
        prisma.assessmentSubmission.count({
          where: { assessmentId, tenantId, manualReview: true }
        }),
        prisma.assessmentSubmission.aggregate({
          where: { assessmentId, tenantId, score: { not: null } },
          _avg: { score: true }
        }),
        prisma.assessmentSubmission.groupBy({
          by: ['score'],
          where: { assessmentId, tenantId, score: { not: null } },
          _count: { id: true }
        })
      ]);
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            totalMarks: assessment.totalMarks,
            passingMarks: assessment.passingMarks,
          },
          statistics: {
            totalSubmissions,
            gradedSubmissions,
            pendingReview,
            averageScore: averageScore._avg.score || 0,
            passingRate: gradedSubmissions > 0 
              ? Math.round((scoreDistribution.filter(s => s.score >= assessment.passingMarks).reduce((acc, s) => acc + s._count.id, 0) / gradedSubmissions) * 100)
              : 0,
            scoreDistribution: scoreDistribution.map(s => ({
              score: s.score,
              count: s._count.id
            })),
          }
        }
      });
    } catch (error) {
      console.error('Error fetching assessment statistics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch assessment statistics' 
      });
    }
  }
);

export default router;