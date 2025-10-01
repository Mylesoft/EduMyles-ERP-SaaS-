export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
  settings: TenantSettings;
  contactInfo: ContactInfo;
  billingInfo?: BillingInfo;
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled'
}

export interface TenantSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  academicYearStart: string; // MM-DD format
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number; // minutes
  maxStudents?: number;
  maxTeachers?: number;
  maxAdmins?: number;
  customFeatures: Record<string, any>;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  address?: Address;
  website?: string;
  principalName?: string;
  principalEmail?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface BillingInfo {
  companyName?: string;
  taxId?: string;
  billingAddress: Address;
  paymentMethod?: PaymentMethod;
}

export interface PaymentMethod {
  type: 'card' | 'bank_transfer' | 'check';
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxStorage: number; // in GB
  supportLevel: 'basic' | 'premium' | 'enterprise';
}

// Multi-tenant context
export interface TenantContext {
  tenant: Tenant;
  user: TenantUser;
  permissions: string[];
  installedModules: string[];
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // Platform admin
  TENANT_ADMIN = 'tenant_admin', // School admin
  PRINCIPAL = 'principal',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  STAFF = 'staff'
}