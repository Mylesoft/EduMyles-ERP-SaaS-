import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { 
  getUserByEmail, 
  createSession, 
  prisma,
  getTenantBySubdomain,
  createAuditLog 
} from '@edumyles/database';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { eventBus } from '../services/event-bus';

interface LoginRequest {
  email: string;
  password: string;
  tenantSubdomain?: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSubdomain: string;
  role?: string;
}

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { email, password, tenantSubdomain }: LoginRequest = req.body;
  const clientIP = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Determine tenant
    let tenant = null;
    let tenantUser = null;

    if (tenantSubdomain) {
      // Login to specific tenant
      tenant = await getTenantBySubdomain(tenantSubdomain);
      if (!tenant) {
        throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      // Check if user is associated with this tenant
      tenantUser = user.tenantUsers.find(tu => tu.tenantId === tenant!.id && tu.isActive);
      if (!tenantUser) {
        throw new AppError('User not authorized for this tenant', 403, 'USER_NOT_AUTHORIZED');
      }
    } else {
      // Auto-select first active tenant if not specified
      const activeTenantUser = user.tenantUsers.find(tu => tu.isActive);
      if (!activeTenantUser) {
        throw new AppError('No active tenant found for user', 403, 'NO_ACTIVE_TENANT');
      }

      tenantUser = activeTenantUser;
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantUser.tenantId },
        include: {
          moduleInstallations: {
            include: { module: true }
          }
        }
      });
    }

    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.id, tenant.id);

    // Create session
    const session = await createSession({
      userId: user.id,
      tenantId: tenant.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      userAgent,
      ipAddress: clientIP,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'USER',
      resourceId: user.id,
      ipAddress: clientIP,
      userAgent,
    });

    // Publish login event
    await eventBus.publish({
      type: 'user.login',
      source: 'auth.controller',
      tenantId: tenant.id,
      data: {
        userId: user.id,
        email: user.email,
        role: tenantUser.role,
        ipAddress: clientIP,
      },
    });

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: tenantUser.role,
    });

    // Return user data (without password hash)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        settings: tenant.settings,
      },
      role: tenantUser.role,
      permissions: tenantUser.permissions,
      preferences: tenantUser.preferences,
      profile: tenantUser.profile,
      installedModules: tenant.moduleInstallations
        .filter(mi => mi.status === 'INSTALLED')
        .map(mi => ({
          id: mi.moduleId,
          version: mi.version,
          config: mi.config,
          module: mi.module,
        })),
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
        },
      },
    });

  } catch (error) {
    logger.error('Login failed', {
      email,
      tenantSubdomain,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    tenantSubdomain,
    role = 'STUDENT' 
  }: RegisterRequest = req.body;

  const clientIP = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    // Check if tenant exists
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    // Check if tenant allows registration
    const tenantSettings = tenant.settings as any;
    if (!tenantSettings.allowRegistration) {
      throw new AppError('Registration is disabled for this tenant', 403, 'REGISTRATION_DISABLED');
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      // Check if user is already associated with this tenant
      const existingTenantUser = existingUser.tenantUsers.find(tu => tu.tenantId === tenant.id);
      if (existingTenantUser) {
        throw new AppError('User already exists in this tenant', 409, 'USER_EXISTS');
      }
      
      // Add user to new tenant
      const tenantUser = await prisma.tenantUser.create({
        data: {
          userId: existingUser.id,
          tenantId: tenant.id,
          role: role as any,
          permissions: [],
          preferences: {},
          profile: {},
        }
      });

      // Create audit log
      await createAuditLog({
        tenantId: tenant.id,
        userId: existingUser.id,
        action: 'USER_TENANT_ADDED',
        resource: 'TENANT_USER',
        resourceId: tenantUser.id,
        ipAddress: clientIP,
        userAgent,
      });

      return res.json({
        success: true,
        message: 'User added to tenant successfully',
        data: {
          message: 'Please login with your existing credentials'
        }
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user with tenant association
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          isActive: true,
          emailVerified: false,
        }
      });

      // Create tenant user relationship
      const tenantUser = await tx.tenantUser.create({
        data: {
          userId: newUser.id,
          tenantId: tenant.id,
          role: role as any,
          permissions: [],
          preferences: {},
          profile: {},
        }
      });

      return { user: newUser, tenantUser };
    });

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      userId: result.user.id,
      action: 'USER_REGISTER',
      resource: 'USER',
      resourceId: result.user.id,
      ipAddress: clientIP,
      userAgent,
    });

    // Publish registration event
    await eventBus.publish({
      type: 'user.register',
      source: 'auth.controller',
      tenantId: tenant.id,
      data: {
        userId: result.user.id,
        email: result.user.email,
        role: result.tenantUser.role,
        ipAddress: clientIP,
      },
    });

    logger.info('User registered successfully', {
      userId: result.user.id,
      email: result.user.email,
      tenantId: tenant.id,
      role: result.tenantUser.role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          emailVerified: result.user.emailVerified,
        },
        message: 'Please check your email for verification'
      }
    });

  } catch (error) {
    logger.error('Registration failed', {
      email,
      tenantSubdomain,
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }

  const { refreshToken: token } = req.body;

  try {
    // Verify refresh token
    const payload = verifyRefreshToken(token);

    // Find session
    const session = await prisma.session.findFirst({
      where: {
        refreshToken: token,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true,
        tenant: true,
      }
    });

    if (!session) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      session.userId, 
      session.tenantId
    );

    // Update session with new tokens
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
        }
      }
    });

  } catch (error) {
    logger.error('Token refresh failed', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

export const logout = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication token required', 401, 'AUTH_TOKEN_REQUIRED');
  }

  const token = authHeader.split(' ')[1];
  const clientIP = req.ip;

  try {
    // Find and deactivate session
    const session = await prisma.session.findFirst({
      where: { token, isActive: true },
      include: { user: true }
    });

    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { isActive: false }
      });

      // Create audit log
      await createAuditLog({
        tenantId: session.tenantId,
        userId: session.userId,
        action: 'USER_LOGOUT',
        resource: 'USER',
        resourceId: session.userId,
        ipAddress: clientIP,
        userAgent: req.get('User-Agent'),
      });

      // Publish logout event
      await eventBus.publish({
        type: 'user.logout',
        source: 'auth.controller',
        tenantId: session.tenantId,
        data: {
          userId: session.userId,
          email: session.user.email,
          ipAddress: clientIP,
        },
      });

      logger.info('User logged out successfully', {
        userId: session.userId,
        email: session.user.email,
        tenantId: session.tenantId,
      });
    }

    res.json({
      success: true,
      message: 'Logout successful',
      data: null
    });

  } catch (error) {
    logger.error('Logout failed', {
      error: error instanceof Error ? error.message : error,
      clientIP,
    });
    throw error;
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  // This endpoint is protected by authMiddleware, so if we reach here, token is valid
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
      tenant: req.tenant,
      tenantContext: req.tenantContext,
    }
  });
};