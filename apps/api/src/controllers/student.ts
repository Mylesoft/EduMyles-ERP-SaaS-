import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma, createAuditLog } from '@edumyles/database';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { eventBus } from '../services/event-bus';

interface CreateStudentRequest {
  studentId: string;
  admissionDate: string;
  currentGrade: string;
  section?: string;
  rollNumber?: string;
  medicalInfo?: any;
  academicInfo?: any;
  transportInfo?: any;
}

interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  graduationDate?: string;
}

export const createStudentProfile = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const {
    studentId,
    admissionDate,
    currentGrade,
    section,
    rollNumber,
    medicalInfo = {},
    academicInfo = {},
    transportInfo = {}
  }: CreateStudentRequest = req.body;

  const { userId } = req.params;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Check if user exists and is in this tenant
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId,
        tenantId,
        isActive: true
      },
      include: {
        user: true
      }
    });

    if (!tenantUser) {
      throw new AppError('User not found in this tenant', 404, 'USER_NOT_FOUND');
    }

    // Check if user already has a student profile
    const existingProfile = await prisma.studentProfile.findFirst({
      where: {
        userId,
        tenantId
      }
    });

    if (existingProfile) {
      throw new AppError('Student profile already exists for this user', 409, 'PROFILE_EXISTS');
    }

    // Check if student ID is unique within tenant
    const existingStudentId = await prisma.studentProfile.findFirst({
      where: {
        tenantId,
        studentId
      }
    });

    if (existingStudentId) {
      throw new AppError('Student ID already exists', 409, 'STUDENT_ID_EXISTS');
    }

    // Check if roll number is unique within tenant (if provided)
    if (rollNumber) {
      const existingRollNumber = await prisma.studentProfile.findFirst({
        where: {
          tenantId,
          rollNumber
        }
      });

      if (existingRollNumber) {
        throw new AppError('Roll number already exists', 409, 'ROLL_NUMBER_EXISTS');
      }
    }

    // Create student profile
    const studentProfile = await prisma.studentProfile.create({
      data: {
        tenantId,
        userId,
        studentId,
        admissionDate: new Date(admissionDate),
        currentGrade,
        section,
        rollNumber,
        medicalInfo,
        academicInfo,
        transportInfo
      }
    });

    // Update user role to STUDENT if not already
    if (tenantUser.role !== 'STUDENT') {
      await prisma.tenantUser.update({
        where: { id: tenantUser.id },
        data: { role: 'STUDENT' }
      });
    }

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'STUDENT_PROFILE_CREATED',
      resource: 'STUDENT_PROFILE',
      resourceId: studentProfile.id,
      newValues: studentProfile,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'student.profile.created',
      source: 'student.controller',
      tenantId,
      data: {
        studentId: studentProfile.id,
        userId: studentProfile.userId,
        studentCode: studentProfile.studentId,
        currentGrade: studentProfile.currentGrade,
        section: studentProfile.section,
        createdBy: req.user.id,
      },
    });

    logger.info('Student profile created successfully', {
      profileId: studentProfile.id,
      studentId: studentProfile.studentId,
      userId: studentProfile.userId,
      tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Student profile created successfully',
      data: {
        studentProfile: {
          ...studentProfile,
          user: {
            id: tenantUser.user.id,
            email: tenantUser.user.email,
            firstName: tenantUser.user.firstName,
            lastName: tenantUser.user.lastName,
            avatar: tenantUser.user.avatar,
          }
        }
      }
    });

  } catch (error) {
    logger.error('Failed to create student profile', {
      userId,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const getStudentProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const tenantId = req.tenant.id;

  try {
    const studentProfile = await prisma.studentProfile.findFirst({
      where: {
        userId,
        tenantId
      },
      include: {
        // Add any related data here when needed
      }
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Get user information
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId,
        tenantId
      },
      include: {
        user: true
      }
    });

    res.json({
      success: true,
      message: 'Student profile retrieved successfully',
      data: {
        studentProfile: {
          ...studentProfile,
          user: tenantUser ? {
            id: tenantUser.user.id,
            email: tenantUser.user.email,
            firstName: tenantUser.user.firstName,
            lastName: tenantUser.user.lastName,
            avatar: tenantUser.user.avatar,
            emailVerified: tenantUser.user.emailVerified,
          } : null
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get student profile', {
      userId,
      tenantId,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

export const updateStudentProfile = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { userId } = req.params;
  const updateData: UpdateStudentRequest = req.body;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Get existing profile
    const existingProfile = await prisma.studentProfile.findFirst({
      where: {
        userId,
        tenantId
      }
    });

    if (!existingProfile) {
      throw new AppError('Student profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Check if studentId is being updated and is unique
    if (updateData.studentId && updateData.studentId !== existingProfile.studentId) {
      const existingStudentId = await prisma.studentProfile.findFirst({
        where: {
          tenantId,
          studentId: updateData.studentId,
          id: { not: existingProfile.id }
        }
      });

      if (existingStudentId) {
        throw new AppError('Student ID already exists', 409, 'STUDENT_ID_EXISTS');
      }
    }

    // Check if rollNumber is being updated and is unique
    if (updateData.rollNumber && updateData.rollNumber !== existingProfile.rollNumber) {
      const existingRollNumber = await prisma.studentProfile.findFirst({
        where: {
          tenantId,
          rollNumber: updateData.rollNumber,
          id: { not: existingProfile.id }
        }
      });

      if (existingRollNumber) {
        throw new AppError('Roll number already exists', 409, 'ROLL_NUMBER_EXISTS');
      }
    }

    // Prepare update data
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    };

    // Convert date strings to Date objects
    if (updateData.admissionDate) {
      updateFields.admissionDate = new Date(updateData.admissionDate);
    }
    if (updateData.graduationDate) {
      updateFields.graduationDate = new Date(updateData.graduationDate);
    }

    // Update student profile
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: existingProfile.id },
      data: updateFields
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'STUDENT_PROFILE_UPDATED',
      resource: 'STUDENT_PROFILE',
      resourceId: updatedProfile.id,
      oldValues: existingProfile,
      newValues: updatedProfile,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'student.profile.updated',
      source: 'student.controller',
      tenantId,
      data: {
        studentId: updatedProfile.id,
        userId: updatedProfile.userId,
        studentCode: updatedProfile.studentId,
        changes: updateData,
        updatedBy: req.user.id,
      },
    });

    logger.info('Student profile updated successfully', {
      profileId: updatedProfile.id,
      studentId: updatedProfile.studentId,
      userId: updatedProfile.userId,
      tenantId,
      updatedBy: req.user.id,
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: {
        studentProfile: updatedProfile
      }
    });

  } catch (error) {
    logger.error('Failed to update student profile', {
      userId,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const getAllStudents = async (req: Request, res: Response) => {
  const tenantId = req.tenant.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const grade = req.query.grade as string;
  const section = req.query.section as string;
  const sortBy = req.query.sortBy as string || 'studentId';
  const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'asc';

  try {
    // Build where clause
    const where: any = {
      tenantId
    };

    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { currentGrade: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (grade) {
      where.currentGrade = grade;
    }

    if (section) {
      where.section = section;
    }

    // Get total count
    const total = await prisma.studentProfile.count({
      where
    });

    // Get students with pagination
    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        // Include user data through a separate query for now
        // We'll join this manually since Prisma doesn't support direct joins
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get user data for each student
    const studentsWithUsers = await Promise.all(
      students.map(async (student) => {
        const tenantUser = await prisma.tenantUser.findFirst({
          where: {
            userId: student.userId,
            tenantId
          },
          include: {
            user: true
          }
        });

        return {
          ...student,
          user: tenantUser ? {
            id: tenantUser.user.id,
            email: tenantUser.user.email,
            firstName: tenantUser.user.firstName,
            lastName: tenantUser.user.lastName,
            avatar: tenantUser.user.avatar,
            emailVerified: tenantUser.user.emailVerified,
          } : null
        };
      })
    );

    res.json({
      success: true,
      message: 'Students retrieved successfully',
      data: {
        students: studentsWithUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get students', {
      tenantId,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

export const deleteStudentProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Get existing profile
    const existingProfile = await prisma.studentProfile.findFirst({
      where: {
        userId,
        tenantId
      }
    });

    if (!existingProfile) {
      throw new AppError('Student profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Delete student profile
    await prisma.studentProfile.delete({
      where: { id: existingProfile.id }
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'STUDENT_PROFILE_DELETED',
      resource: 'STUDENT_PROFILE',
      resourceId: existingProfile.id,
      oldValues: existingProfile,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'student.profile.deleted',
      source: 'student.controller',
      tenantId,
      data: {
        studentId: existingProfile.id,
        userId: existingProfile.userId,
        studentCode: existingProfile.studentId,
        deletedBy: req.user.id,
      },
    });

    logger.info('Student profile deleted successfully', {
      profileId: existingProfile.id,
      studentId: existingProfile.studentId,
      userId: existingProfile.userId,
      tenantId,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Student profile deleted successfully',
      data: null
    });

  } catch (error) {
    logger.error('Failed to delete student profile', {
      userId,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};