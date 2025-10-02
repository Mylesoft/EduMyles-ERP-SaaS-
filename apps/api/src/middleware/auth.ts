import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getValidSession } from '@edumyles/database';
import { AppError } from './error-handler';

declare global {
  namespace Express {
    interface UserClaims {
      sub: string;
      email: string;
      [key: string]: unknown;
    }
    interface Request {
      user?: Record<string, unknown>;
      session?: Record<string, unknown>;
      tenant?: Record<string, unknown> & { id?: string };
      tenantContext?: import('@edumyles/types').TenantContext;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required', 401, 'AUTH_TOKEN_REQUIRED');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Authentication token is required', 401, 'AUTH_TOKEN_REQUIRED');
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500, 'JWT_SECRET_MISSING');
    }

    try {
      jwt.verify(token, jwtSecret);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
    }

    // Validate session in database
    const session = await getValidSession(token);
    
    if (!session) {
      throw new AppError('Session not found or expired', 401, 'SESSION_INVALID');
    }

    // Verify tenant matches (if tenant middleware ran first)
    if (req.tenant && session.tenantId !== (req.tenant as any).id) {
      throw new AppError('Token does not match tenant', 403, 'TENANT_MISMATCH');
    }

    // Find the tenant user relationship
    const tenantUser = (session as any).user?.tenantUsers?.find((tu: any) => tu.tenantId === (session as any).tenantId);
    
    if (!tenantUser) {
      throw new AppError('User not authorized for this tenant', 403, 'USER_NOT_AUTHORIZED');
    }

    // Attach session and user to request
    req.session = session;
    req.user = {
      ...(session as any).user,
      tenantRole: (tenantUser as any).role,
      tenantPermissions: (tenantUser as any).permissions,
      tenantPreferences: (tenantUser as any).preferences,
      tenantProfile: (tenantUser as any).profile,
    } as any;

    // Create tenant context
    if (req.tenant) {
      req.tenantContext = {
        tenant: req.tenant,
        user: req.user,
        permissions: Array.isArray(tenantUser.permissions) ? tenantUser.permissions as string[] : [],
        installedModules: (req.tenant as any).moduleInstallations
          .filter((mi: any) => mi.status === 'INSTALLED')
          .map((mi: any) => mi.moduleId),
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requirePermission = (permission: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const userPermissions = (req.user as any).tenantPermissions || [];
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    // Check if user has super admin permission
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check specific permissions
    const hasPermission = requiredPermissions.some(perm => {
      // Check exact match
      if (userPermissions.includes(perm)) return true;

      // Check wildcard permissions
      const wildcardPerm = perm.split(':')[0] + ':*';
      if (userPermissions.includes(wildcardPerm)) return true;

      return false;
    });

    if (!hasPermission) {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS', {
        required: requiredPermissions,
        user: userPermissions,
      });
    }

    next();
  };
};

export const requireRole = (role: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const userRole = (req.user as any).tenantRole;
    const requiredRoles = Array.isArray(role) ? role : [role];

    if (!requiredRoles.includes(userRole)) {
      throw new AppError('Insufficient role permissions', 403, 'INSUFFICIENT_ROLE', {
        required: requiredRoles,
        user: userRole,
      });
    }

    next();
  };
};