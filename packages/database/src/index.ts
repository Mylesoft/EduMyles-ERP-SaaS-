import { PrismaClient } from '@prisma/client';
import type {
  Tenant as PrismaTenant,
  User as PrismaUser,
  TenantUser as PrismaTenantUser,
  Session as PrismaSession,
  Module as PrismaModule,
  ModuleInstallation as PrismaModuleInstallation,
  Event as PrismaEvent,
  EventSubscription as PrismaEventSubscription,
  Permission as PrismaPermission,
  RolePermission as PrismaRolePermission,
  AcademicYear as PrismaAcademicYear,
  Semester as PrismaSemester,
  Grade as PrismaGrade,
  Class as PrismaClass,
  Subject as PrismaSubject,
  StudentProfile as PrismaStudentProfile,
  TeacherProfile as PrismaTeacherProfile,
  ParentProfile as PrismaParentProfile,
  AuditLog as PrismaAuditLog,
  TenantStatus,
  UserRole,
  ModuleInstallationStatus,
} from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export { prisma };
export * from '@prisma/client';

// Re-export types for convenience
// Local aliases to ensure types are available in this module's scope
export type Tenant = PrismaTenant;
export type User = PrismaUser;
export type TenantUser = PrismaTenantUser;
export type Session = PrismaSession;
export type Module = PrismaModule;
export type ModuleInstallation = PrismaModuleInstallation;
export type Event = PrismaEvent;
export type EventSubscription = PrismaEventSubscription;
export type Permission = PrismaPermission;
export type RolePermission = PrismaRolePermission;
export type AcademicYear = PrismaAcademicYear;
export type Semester = PrismaSemester;
export type Grade = PrismaGrade;
export type Class = PrismaClass;
export type Subject = PrismaSubject;
export type StudentProfile = PrismaStudentProfile;
export type TeacherProfile = PrismaTeacherProfile;
export type ParentProfile = PrismaParentProfile;
export type AuditLog = PrismaAuditLog;

// Export enums
export { TenantStatus, UserRole, ModuleInstallationStatus } from '@prisma/client';

// Utility types for common operations
export type CreateTenantData = Omit<PrismaTenant, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTenantData = Partial<Omit<PrismaTenant, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateUserData = Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;
export type UpdateUserData = Partial<Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateTenantUserData = Omit<PrismaTenantUser, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTenantUserData = Partial<Omit<PrismaTenantUser, 'id' | 'createdAt' | 'updatedAt'>>;

// Database helper functions
export async function createTenant(data: CreateTenantData) {
  return prisma.tenant.create({ data });
}

export async function getTenantBySubdomain(subdomain: string) {
  return prisma.tenant.findUnique({
    where: { subdomain },
    include: {
      users: {
        include: {
          user: true
        }
      },
      moduleInstallations: {
        include: {
          module: true
        }
      }
    }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      tenantUsers: {
        include: {
          tenant: true
        }
      }
    }
  });
}

export async function createSession(data: Omit<PrismaSession, 'id' | 'createdAt'>) {
  return prisma.session.create({ data });
}

export async function getValidSession(token: string) {
  return prisma.session.findFirst({
    where: {
      token,
      isActive: true,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
        include: {
          tenantUsers: {
            include: {
              tenant: true
            }
          }
        }
      }
    }
  });
}

export async function installModule(tenantId: string, moduleId: string, version: string, config: any = {}) {
  return prisma.moduleInstallation.create({
    data: {
      tenantId,
      moduleId,
      version,
      config,
      status: 'INSTALLING'
    }
  });
}

export async function getInstalledModules(tenantId: string) {
  return prisma.moduleInstallation.findMany({
    where: {
      tenantId,
      status: 'INSTALLED'
    },
    include: {
      module: true
    }
  });
}

export async function publishEvent(data: Omit<PrismaEvent, 'id' | 'timestamp'>) {
  return prisma.event.create({
    data: {
      ...data,
      timestamp: new Date()
    }
  });
}

export async function getEventSubscriptions(eventType: string) {
  return prisma.eventSubscription.findMany({
    where: {
      eventType,
      active: true
    },
    orderBy: {
      priority: 'desc'
    }
  });
}

export async function createAuditLog(data: Omit<PrismaAuditLog, 'id' | 'timestamp'>) {
  return prisma.auditLog.create({
    data: {
      ...data,
      timestamp: new Date()
    }
  });
}

// Connection management
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Health check
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}