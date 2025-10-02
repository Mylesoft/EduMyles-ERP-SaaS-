import request from 'supertest';
import app from '../index';
import { prisma } from '@edumyles/database';
import bcrypt from 'bcrypt';

describe('Authentication Endpoints', () => {
  let testTenant: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test School',
        subdomain: 'test',
        status: 'ACTIVE',
        settings: {
          allowRegistration: true,
        },
        contactInfo: {},
        plan: {},
      },
    });

    // Create test user
    const passwordHash = await bcrypt.hash('testpassword', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash,
        isActive: true,
        emailVerified: true,
      },
    });

    // Create tenant user relationship
    await prisma.tenantUser.create({
      data: {
        userId: testUser.id,
        tenantId: testTenant.id,
        role: 'STUDENT',
        permissions: [],
        preferences: {},
        profile: {},
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.tenantUser.deleteMany({
      where: { tenantId: testTenant.id },
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });
    await prisma.tenant.deleteMany({
      where: { id: testTenant.id },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'testpassword',
          tenantSubdomain: 'test',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword',
          tenantSubdomain: 'test',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with non-existent tenant', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'testpassword',
          tenantSubdomain: 'nonexistent',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TENANT_NOT_FOUND');
    });

    it('should fail with validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'newpassword123',
          firstName: 'New',
          lastName: 'User',
          tenantSubdomain: 'test',
          role: 'STUDENT',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();

      // Cleanup
      const newUser = await prisma.user.findUnique({
        where: { email: 'newuser@test.com' },
      });
      if (newUser) {
        await prisma.tenantUser.deleteMany({
          where: { userId: newUser.id },
        });
        await prisma.user.delete({
          where: { id: newUser.id },
        });
      }
    });

    it('should fail when trying to register existing user in same tenant', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'testpassword',
          firstName: 'Test',
          lastName: 'User',
          tenantSubdomain: 'test',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });
  });
});

describe('Student Management Endpoints', () => {
  let testTenant: any;
  let testUser: any;
  let adminUser: any;
  let adminTokens: any;

  beforeAll(async () => {
    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test School 2',
        subdomain: 'test2',
        status: 'ACTIVE',
        settings: {
          allowRegistration: true,
        },
        contactInfo: {},
        plan: {},
      },
    });

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('adminpassword', 12);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test2.com',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: adminPasswordHash,
        isActive: true,
        emailVerified: true,
      },
    });

    await prisma.tenantUser.create({
      data: {
        userId: adminUser.id,
        tenantId: testTenant.id,
        role: 'TENANT_ADMIN',
        permissions: ['*'],
        preferences: {},
        profile: {},
      },
    });

    // Login to get tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test2.com',
        password: 'adminpassword',
        tenantSubdomain: 'test2',
      });
    
    adminTokens = loginResponse.body.data.tokens;

    // Create regular test user
    const passwordHash = await bcrypt.hash('studentpassword', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'student@test2.com',
        firstName: 'Student',
        lastName: 'User',
        passwordHash,
        isActive: true,
        emailVerified: true,
      },
    });

    await prisma.tenantUser.create({
      data: {
        userId: testUser.id,
        tenantId: testTenant.id,
        role: 'STUDENT',
        permissions: [],
        preferences: {},
        profile: {},
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.studentProfile.deleteMany({
      where: { tenantId: testTenant.id },
    });
    await prisma.session.deleteMany({
      where: { tenantId: testTenant.id },
    });
    await prisma.tenantUser.deleteMany({
      where: { tenantId: testTenant.id },
    });
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { id: adminUser.id },
          { id: testUser.id }
        ]
      },
    });
    await prisma.tenant.deleteMany({
      where: { id: testTenant.id },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/students/users/:userId/profile', () => {
    it('should create student profile successfully', async () => {
      const response = await request(app)
        .post(`/api/students/users/${testUser.id}/profile`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .set('X-Tenant-Subdomain', 'test2')
        .send({
          studentId: 'STU001',
          admissionDate: '2024-01-01',
          currentGrade: 'Grade 10',
          section: 'A',
          rollNumber: 'R001',
          medicalInfo: { allergies: 'None' },
          academicInfo: { previousSchool: 'Elementary School' },
          transportInfo: { busRoute: 'Route 1' },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.studentProfile).toBeDefined();
      expect(response.body.data.studentProfile.studentId).toBe('STU001');
    });

    it('should fail without authorization', async () => {
      const response = await request(app)
        .post(`/api/students/users/${testUser.id}/profile`)
        .set('X-Tenant-Subdomain', 'test2')
        .send({
          studentId: 'STU002',
          admissionDate: '2024-01-01',
          currentGrade: 'Grade 10',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/students', () => {
    it('should get students list successfully', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .set('X-Tenant-Subdomain', 'test2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination and filtering', async () => {
      const response = await request(app)
        .get('/api/students')
        .query({
          page: 1,
          limit: 10,
          search: 'Student',
          sortBy: 'studentId',
          sortOrder: 'asc',
        })
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .set('X-Tenant-Subdomain', 'test2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });
});