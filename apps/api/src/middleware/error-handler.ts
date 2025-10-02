import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(message: string, statusCode: number = 500, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  void _next; // satisfy lint unused param in type signature
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details;

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this information already exists';
        details = { field: prismaError.meta?.target };
        break;
      case 'P2025':
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'The requested record was not found';
        break;
      default:
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Internal server error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        details: error.details,
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
      },
    });
  } else {
    logger.warn('Client error:', {
      statusCode,
      code,
      message,
      details,
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      },
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: error.stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown',
    },
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

export const asyncHandler = <T extends (req: Request, res: Response, next: NextFunction) => any>(fn: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};