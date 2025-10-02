import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error-handler';

interface TokenPayload {
  userId: string;
  tenantId: string;
  type: 'access' | 'refresh';
}

export function generateTokens(userId: string, tenantId: string) {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new AppError('JWT secrets not configured', 500, 'JWT_SECRETS_MISSING');
  }

  // Generate access token (24 hours)
  const accessToken = jwt.sign(
    {
      userId,
      tenantId,
      type: 'access',
    } as TokenPayload,
    jwtSecret,
    {
      expiresIn: '24h',
      issuer: 'edumyles-api',
      audience: 'edumyles-client',
    }
  );

  // Generate refresh token (7 days)
  const refreshToken = jwt.sign(
    {
      userId,
      tenantId,
      type: 'refresh',
    } as TokenPayload,
    jwtRefreshSecret,
    {
      expiresIn: '7d',
      issuer: 'edumyles-api',
      audience: 'edumyles-client',
    }
  );

  return {
    accessToken,
    refreshToken,
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new AppError('JWT secret not configured', 500, 'JWT_SECRET_MISSING');
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      issuer: 'edumyles-api',
      audience: 'edumyles-client',
    }) as TokenPayload;

    if (payload.type !== 'access') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token has expired', 401, 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
    }
    throw error;
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtRefreshSecret) {
    throw new AppError('JWT refresh secret not configured', 500, 'JWT_REFRESH_SECRET_MISSING');
  }

  try {
    const payload = jwt.verify(token, jwtRefreshSecret, {
      issuer: 'edumyles-api',
      audience: 'edumyles-client',
    }) as TokenPayload;

    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token has expired', 401, 'REFRESH_TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    throw error;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Utility to check if token is about to expire (within 5 minutes)
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return (expirationTime - currentTime) <= fiveMinutes;
  } catch (error) {
    return true;
  }
}

// Generate a secure random token for email verification, password reset, etc.
export function generateSecureToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}