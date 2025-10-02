import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma, createAuditLog } from '@edumyles/database';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { eventBus } from '../services/event-bus';

// Academic Year Controllers
export const createAcademicYear = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { name, startDate, endDate, isActive = false } = req.body;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Check if academic year name already exists for this tenant
    const existingYear = await prisma.academicYear.findFirst({
      where: {
        tenantId,
        name
      }
    });

    if (existingYear) {
      throw new AppError('Academic year name already exists', 409, 'ACADEMIC_YEAR_EXISTS');
    }

    // If this year is being set as active, deactivate all other years
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { tenantId },
        data: { isActive: false }
      });
    }

    // Create academic year
    const academicYear = await prisma.academicYear.create({
      data: {
        tenantId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive
      }
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'ACADEMIC_YEAR_CREATED',
      resource: 'ACADEMIC_YEAR',
      resourceId: academicYear.id,
      newValues: academicYear,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'academic.year.created',
      source: 'academic.controller',
      tenantId,
      data: {
        academicYearId: academicYear.id,
        name: academicYear.name,
        isActive: academicYear.isActive,
        createdBy: req.user.id,
      },
    });

    logger.info('Academic year created successfully', {
      yearId: academicYear.id,
      name: academicYear.name,
      tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      data: { academicYear }
    });

  } catch (error) {
    logger.error('Failed to create academic year', {
      name,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const getAcademicYears = async (req: Request, res: Response) => {
  const tenantId = req.tenant.id;
  const includeInactive = req.query.includeInactive === 'true';

  try {
    const where: any = { tenantId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const academicYears = await prisma.academicYear.findMany({
      where,
      include: {
        semesters: {
          orderBy: { startDate: 'asc' }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json({
      success: true,
      message: 'Academic years retrieved successfully',
      data: { academicYears }
    });

  } catch (error) {
    logger.error('Failed to get academic years', {
      tenantId,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

// Semester Controllers
export const createSemester = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { academicYearId, name, startDate, endDate, isActive = false } = req.body;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Verify academic year exists and belongs to this tenant
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        id: academicYearId,
        tenantId
      }
    });

    if (!academicYear) {
      throw new AppError('Academic year not found', 404, 'ACADEMIC_YEAR_NOT_FOUND');
    }

    // Check if semester name already exists for this academic year
    const existingSemester = await prisma.semester.findFirst({
      where: {
        tenantId,
        academicYearId,
        name
      }
    });

    if (existingSemester) {
      throw new AppError('Semester name already exists for this academic year', 409, 'SEMESTER_EXISTS');
    }

    // If this semester is being set as active, deactivate all other semesters in this academic year
    if (isActive) {
      await prisma.semester.updateMany({
        where: { tenantId, academicYearId },
        data: { isActive: false }
      });
    }

    // Create semester
    const semester = await prisma.semester.create({
      data: {
        tenantId,
        academicYearId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive
      }
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'SEMESTER_CREATED',
      resource: 'SEMESTER',
      resourceId: semester.id,
      newValues: semester,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'academic.semester.created',
      source: 'academic.controller',
      tenantId,
      data: {
        semesterId: semester.id,
        name: semester.name,
        academicYearId: semester.academicYearId,
        isActive: semester.isActive,
        createdBy: req.user.id,
      },
    });

    logger.info('Semester created successfully', {
      semesterId: semester.id,
      name: semester.name,
      academicYearId,
      tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Semester created successfully',
      data: { semester }
    });

  } catch (error) {
    logger.error('Failed to create semester', {
      name,
      academicYearId,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

// Grade Controllers
export const createGrade = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { name, level, description } = req.body;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Check if grade name or level already exists for this tenant
    const existingGrade = await prisma.grade.findFirst({
      where: {
        tenantId,
        OR: [
          { name },
          { level }
        ]
      }
    });

    if (existingGrade) {
      const conflictType = existingGrade.name === name ? 'name' : 'level';
      throw new AppError(`Grade ${conflictType} already exists`, 409, 'GRADE_EXISTS');
    }

    // Create grade
    const grade = await prisma.grade.create({
      data: {
        tenantId,
        name,
        level,
        description
      }
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'GRADE_CREATED',
      resource: 'GRADE',
      resourceId: grade.id,
      newValues: grade,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'academic.grade.created',
      source: 'academic.controller',
      tenantId,
      data: {
        gradeId: grade.id,
        name: grade.name,
        level: grade.level,
        createdBy: req.user.id,
      },
    });

    logger.info('Grade created successfully', {
      gradeId: grade.id,
      name: grade.name,
      level: grade.level,
      tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Grade created successfully',
      data: { grade }
    });

  } catch (error) {
    logger.error('Failed to create grade', {
      name,
      level,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const getGrades = async (req: Request, res: Response) => {
  const tenantId = req.tenant.id;

  try {
    const grades = await prisma.grade.findMany({
      where: { tenantId },
      include: {
        classes: {
          include: {
            semester: {
              include: {
                academicYear: true
              }
            }
          }
        },
        subjects: true
      },
      orderBy: { level: 'asc' }
    });

    res.json({
      success: true,
      message: 'Grades retrieved successfully',
      data: { grades }
    });

  } catch (error) {
    logger.error('Failed to get grades', {
      tenantId,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

// Subject Controllers
export const createSubject = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { gradeId, name, code, description, color, credits } = req.body;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Verify grade exists and belongs to this tenant
    const grade = await prisma.grade.findFirst({
      where: {
        id: gradeId,
        tenantId
      }
    });

    if (!grade) {
      throw new AppError('Grade not found', 404, 'GRADE_NOT_FOUND');
    }

    // Check if subject code already exists for this grade
    const existingSubject = await prisma.subject.findFirst({
      where: {
        tenantId,
        gradeId,
        code
      }
    });

    if (existingSubject) {
      throw new AppError('Subject code already exists for this grade', 409, 'SUBJECT_CODE_EXISTS');
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        tenantId,
        gradeId,
        name,
        code,
        description,
        color,
        credits
      }
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'SUBJECT_CREATED',
      resource: 'SUBJECT',
      resourceId: subject.id,
      newValues: subject,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'academic.subject.created',
      source: 'academic.controller',
      tenantId,
      data: {
        subjectId: subject.id,
        name: subject.name,
        code: subject.code,
        gradeId: subject.gradeId,
        createdBy: req.user.id,
      },
    });

    logger.info('Subject created successfully', {
      subjectId: subject.id,
      name: subject.name,
      code: subject.code,
      gradeId,
      tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject }
    });

  } catch (error) {
    logger.error('Failed to create subject', {
      name,
      code,
      gradeId,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

// Class Controllers
export const createClass = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { gradeId, semesterId, name, capacity } = req.body;
  const tenantId = req.tenant.id;
  const clientIP = req.ip;

  try {
    // Verify grade and semester exist and belong to this tenant
    const [grade, semester] = await Promise.all([
      prisma.grade.findFirst({
        where: { id: gradeId, tenantId }
      }),
      prisma.semester.findFirst({
        where: { id: semesterId, tenantId }
      })
    ]);

    if (!grade) {
      throw new AppError('Grade not found', 404, 'GRADE_NOT_FOUND');
    }

    if (!semester) {
      throw new AppError('Semester not found', 404, 'SEMESTER_NOT_FOUND');
    }

    // Check if class name already exists for this grade and semester
    const existingClass = await prisma.class.findFirst({
      where: {
        tenantId,
        gradeId,
        semesterId,
        name
      }
    });

    if (existingClass) {
      throw new AppError('Class name already exists for this grade and semester', 409, 'CLASS_EXISTS');
    }

    // Create class
    const classData = await prisma.class.create({
      data: {
        tenantId,
        gradeId,
        semesterId,
        name,
        capacity
      }
    });

    // Create audit log
    await createAuditLog({
      tenantId,
      userId: req.user.id,
      action: 'CLASS_CREATED',
      resource: 'CLASS',
      resourceId: classData.id,
      newValues: classData,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent'),
    });

    // Publish event
    await eventBus.publish({
      type: 'academic.class.created',
      source: 'academic.controller',
      tenantId,
      data: {
        classId: classData.id,
        name: classData.name,
        gradeId: classData.gradeId,
        semesterId: classData.semesterId,
        capacity: classData.capacity,
        createdBy: req.user.id,
      },
    });

    logger.info('Class created successfully', {
      classId: classData.id,
      name: classData.name,
      gradeId,
      semesterId,
      tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { class: classData }
    });

  } catch (error) {
    logger.error('Failed to create class', {
      name,
      gradeId,
      semesterId,
      tenantId,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const getClasses = async (req: Request, res: Response) => {
  const tenantId = req.tenant.id;
  const gradeId = req.query.gradeId as string;
  const semesterId = req.query.semesterId as string;

  try {
    const where: any = { tenantId };

    if (gradeId) {
      where.gradeId = gradeId;
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        grade: true,
        semester: {
          include: {
            academicYear: true
          }
        }
      },
      orderBy: [
        { grade: { level: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      message: 'Classes retrieved successfully',
      data: { classes }
    });

  } catch (error) {
    logger.error('Failed to get classes', {
      tenantId,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};