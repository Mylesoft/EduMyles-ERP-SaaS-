import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

export const validatePermissions = (requiredPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const userPermissions = req.user.tenantPermissions || [];
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

      // Check if user has super admin permission
      if (userPermissions.includes('*')) {
        return next();
      }

      // Check specific permissions
      const hasPermission = permissions.some(perm => {
        // Check exact match
        if (userPermissions.includes(perm)) return true;

        // Check wildcard permissions
        const wildcardPerm = perm.split(':')[0] + ':*';
        if (userPermissions.includes(wildcardPerm)) return true;

        return false;
      });

      if (!hasPermission) {
        throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS', {
          required: permissions,
          user: userPermissions,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};