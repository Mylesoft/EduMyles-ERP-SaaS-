export interface AuthSession {
  id: string;
  userId: string;
  tenantId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSubdomain?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface PasswordResetRequest {
  email: string;
  tenantSubdomain?: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

export interface TwoFactorAuth {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

import { UserRole } from './user';