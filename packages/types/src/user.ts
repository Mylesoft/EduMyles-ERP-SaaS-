export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface TenantUserProfile extends User {
  tenantId: string;
  role: UserRole;
  permissions: string[];
  preferences: UserPreferences;
  profile: UserProfileDetails;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  categories: Record<string, boolean>;
}

export interface DashboardPreferences {
  widgets: string[];
  layout: 'grid' | 'list';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface UserProfileDetails {
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: Address;
  emergencyContact?: EmergencyContact;
  bio?: string;
  socialLinks?: SocialLinks;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}

export interface StudentProfile extends UserProfileDetails {
  studentId: string;
  admissionDate: Date;
  graduationDate?: Date;
  currentGrade: string;
  section?: string;
  rollNumber?: string;
  parentIds: string[];
  medicalInfo?: MedicalInfo;
  academicInfo: AcademicInfo;
  transportInfo?: TransportInfo;
}

export interface MedicalInfo {
  bloodGroup?: string;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  doctorName?: string;
  doctorPhone?: string;
  insuranceInfo?: InsuranceInfo;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validUntil: Date;
}

export interface AcademicInfo {
  previousSchool?: string;
  previousGrade?: string;
  transferDate?: Date;
  subjects: string[];
  specialNeeds?: string[];
  achievements?: Achievement[];
}

export interface Achievement {
  title: string;
  description?: string;
  dateAwarded: Date;
  awardedBy: string;
  category: string;
}

export interface TransportInfo {
  busRoute?: string;
  pickupPoint?: string;
  dropoffPoint?: string;
  pickupTime?: string;
  dropoffTime?: string;
}

export interface TeacherProfile extends UserProfileDetails {
  employeeId: string;
  hireDate: Date;
  department: string;
  subjects: string[];
  qualifications: Qualification[];
  experience: number; // years
  salary?: SalaryInfo;
  workSchedule?: WorkSchedule;
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
  grade?: string;
}

export interface SalaryInfo {
  amount: number;
  currency: string;
  paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly';
}

export interface WorkSchedule {
  workingDays: number[];
  startTime: string;
  endTime: string;
  breakTime?: {
    start: string;
    end: string;
  };
}

export interface ParentProfile extends UserProfileDetails {
  children: string[]; // Student IDs
  occupation?: string;
  workplace?: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  PRINCIPAL = 'principal',
  VICE_PRINCIPAL = 'vice_principal',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  STAFF = 'staff',
  LIBRARIAN = 'librarian',
  ACCOUNTANT = 'accountant',
  NURSE = 'nurse',
  SECURITY = 'security'
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  inherits?: UserRole[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}