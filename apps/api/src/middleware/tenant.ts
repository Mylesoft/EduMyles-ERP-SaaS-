import { Request, Response, NextFunction } from 'express';
import { getTenantBySubdomain } from '@edumyles/database';
import { AppError } from './error-handler';
import { TenantContext } from '@edumyles/types';

declare global {
  namespace Express {
    interface Request {
      tenant?: any;
      tenantContext?: TenantContext;
    }
  }
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let tenantSubdomain: string | undefined;

    // Try to get tenant from subdomain (e.g., demo.edumyles.com)
    const host = req.get('host');
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'localhost' && subdomain !== '127') {
        tenantSubdomain = subdomain;
      }
    }

    // Fallback to header or query parameter
    if (!tenantSubdomain) {
      tenantSubdomain = req.headers['x-tenant-subdomain'] as string || req.query.tenant as string;
    }

    // Skip tenant resolution for health check and auth routes
    const isHealthCheck = req.path === '/health';
    const isAuthRoute = req.path.startsWith('/api/auth');
    
    if (isHealthCheck || isAuthRoute) {
      return next();
    }

    if (!tenantSubdomain) {
      throw new AppError('Tenant subdomain is required', 400, 'TENANT_REQUIRED');
    }

    // Fetch tenant from database
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    
    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new AppError('Tenant is not active', 403, 'TENANT_INACTIVE');
    }

    // Attach tenant to request
    req.tenant = tenant;

    next();
  } catch (error) {
    next(error);
  }
};

// Alias for compatibility with route files
export const validateTenant = tenantMiddleware;