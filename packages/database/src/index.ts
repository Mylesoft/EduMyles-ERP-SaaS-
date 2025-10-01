import { PrismaClient } from '@prisma/client';

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
export type {
  Tenant,
  User,
  TenantUser,
  Session,
  Module,
  ModuleInstallation,
  Event,
  EventSubscription,
  Permission,
  RolePermission,
  AcademicYear,
  Semester,
  Grade,
  Class,
  Subject,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  AuditLog,
} from '@prisma/client';

// Export enums
export {
  TenantStatus,
  UserRole,
  ModuleInstallationStatus,
} from '@prisma/client';

// Utility types for common operations
export type CreateTenantData = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTenantData = Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateTenantUserData = Omit<TenantUser, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTenantUserData = Partial<Omit<TenantUser, 'id' | 'createdAt' | 'updatedAt'>>;

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

export async function createSession(data: Omit<Session, 'id' | 'createdAt'>) {
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

export async function publishEvent(data: Omit<Event, 'id' | 'timestamp'>) {
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

export async function createAuditLog(data: Omit<AuditLog, 'id' | 'timestamp'>) {
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