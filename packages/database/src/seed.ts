import { PrismaClient, UserRole, TenantStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo tenant
  console.log('Creating demo tenant...');
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo High School',
      subdomain: 'demo',
      primaryColor: '#3B82F6',
      secondaryColor: '#EF4444',
      status: TenantStatus.ACTIVE,
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        language: 'en',
        academicYearStart: '09-01',
        weekStartsOn: 1,
        allowUserRegistration: false,
        requireEmailVerification: true,
        sessionTimeout: 480,
        maxStudents: 1000,
        maxTeachers: 100,
        maxAdmins: 10,
        customFeatures: {}
      },
      contactInfo: {
        email: 'admin@demo.edumyles.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Education St',
          city: 'Learning City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        website: 'https://demo.edumyles.com',
        principalName: 'Dr. Jane Smith',
        principalEmail: 'principal@demo.edumyles.com'
      },
      plan: {
        id: 'premium',
        name: 'Premium Plan',
        price: 299,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['academic_management', 'financial_management', 'communication_hub'],
        maxUsers: 1000,
        maxStorage: 100,
        supportLevel: 'premium'
      }
    },
  });

  // Create super admin user
  console.log('Creating super admin user...');
  const superAdminPassword = await hash('admin123!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@edumyles.com' },
    update: {},
    create: {
      email: 'admin@edumyles.com',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: superAdminPassword,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create tenant admin user
  console.log('Creating tenant admin user...');
  const tenantAdminPassword = await hash('admin123!', 12);
  const tenantAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.edumyles.com' },
    update: {},
    create: {
      email: 'admin@demo.edumyles.com',
      firstName: 'School',
      lastName: 'Admin',
      passwordHash: tenantAdminPassword,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create principal user
  console.log('Creating principal user...');
  const principalPassword = await hash('principal123!', 12);
  const principal = await prisma.user.upsert({
    where: { email: 'principal@demo.edumyles.com' },
    update: {},
    create: {
      email: 'principal@demo.edumyles.com',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      passwordHash: principalPassword,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create demo teacher
  console.log('Creating demo teacher...');
  const teacherPassword = await hash('teacher123!', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demo.edumyles.com' },
    update: {},
    create: {
      email: 'teacher@demo.edumyles.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: teacherPassword,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create demo student
  console.log('Creating demo student...');
  const studentPassword = await hash('student123!', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@demo.edumyles.com' },
    update: {},
    create: {
      email: 'student@demo.edumyles.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      passwordHash: studentPassword,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create demo parent
  console.log('Creating demo parent...');
  const parentPassword = await hash('parent123!', 12);
  const parent = await prisma.user.upsert({
    where: { email: 'parent@demo.edumyles.com' },
    update: {},
    create: {
      email: 'parent@demo.edumyles.com',
      firstName: 'Mary',
      lastName: 'Johnson',
      passwordHash: parentPassword,
      emailVerified: true,
      isActive: true,
    },
  });

  // Create tenant user relationships
  console.log('Creating tenant user relationships...');
  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: superAdmin.id
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: superAdmin.id,
      role: UserRole.SUPER_ADMIN,
      permissions: ['*'],
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          frequency: 'immediate',
          categories: {}
        },
        dashboard: {
          widgets: ['overview', 'recent_activity', 'quick_actions'],
          layout: 'grid',
          density: 'comfortable'
        }
      },
      profile: {}
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: tenantAdmin.id
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: tenantAdmin.id,
      role: UserRole.TENANT_ADMIN,
      permissions: ['tenant:*'],
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: true,
          inApp: true,
          frequency: 'immediate',
          categories: {}
        },
        dashboard: {
          widgets: ['student_overview', 'teacher_overview', 'financial_summary'],
          layout: 'grid',
          density: 'comfortable'
        }
      },
      profile: {}
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: principal.id
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: principal.id,
      role: UserRole.PRINCIPAL,
      permissions: ['academic:*', 'communication:*', 'reports:read'],
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: true,
          inApp: true,
          frequency: 'immediate',
          categories: {}
        },
        dashboard: {
          widgets: ['school_overview', 'academic_performance', 'announcements'],
          layout: 'grid',
          density: 'comfortable'
        }
      },
      profile: {}
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: teacher.id
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: teacher.id,
      role: UserRole.TEACHER,
      permissions: ['academic:read', 'academic:write_own', 'communication:send'],
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          frequency: 'daily',
          categories: {}
        },
        dashboard: {
          widgets: ['my_classes', 'recent_submissions', 'upcoming_events'],
          layout: 'list',
          density: 'comfortable'
        }
      },
      profile: {}
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: student.id
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: student.id,
      role: UserRole.STUDENT,
      permissions: ['academic:read_own', 'assignments:submit'],
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',
        notifications: {
          email: false,
          push: true,
          sms: false,
          inApp: true,
          frequency: 'daily',
          categories: {}
        },
        dashboard: {
          widgets: ['my_grades', 'assignments', 'schedule'],
          layout: 'grid',
          density: 'compact'
        }
      },
      profile: {}
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: parent.id
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: parent.id,
      role: UserRole.PARENT,
      permissions: ['student:read_children', 'communication:receive'],
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: true,
          inApp: true,
          frequency: 'immediate',
          categories: {}
        },
        dashboard: {
          widgets: ['children_grades', 'upcoming_events', 'communications'],
          layout: 'grid',
          density: 'comfortable'
        }
      },
      profile: {}
    },
  });

  // Create core modules
  console.log('Creating core modules...');
  const coreModules = [
    {
      id: 'academic-management',
      name: 'Academic Management Suite',
      version: '1.0.0',
      description: 'Comprehensive academic management including grades, attendance, and curriculum',
      author: 'EduMyles Team',
      category: 'academic',
      icon: '🎓',
      manifest: {
        dependencies: [],
        permissions: ['academic:*'],
        apiEndpoints: [
          { path: '/api/grades', method: 'GET', handler: 'getGrades' },
          { path: '/api/attendance', method: 'GET', handler: 'getAttendance' },
        ],
        dashboardWidgets: [
          { id: 'grade-overview', title: 'Grade Overview', component: 'GradeOverview', size: 'medium' },
          { id: 'attendance-summary', title: 'Attendance Summary', component: 'AttendanceSummary', size: 'small' },
        ],
        navigationItems: [
          { id: 'grades', title: 'Grades', path: '/grades', icon: '📊' },
          { id: 'attendance', title: 'Attendance', path: '/attendance', icon: '📅' },
        ]
      },
      pricing: {
        type: 'free'
      }
    },
    {
      id: 'financial-management',
      name: 'Financial Management',
      version: '1.0.0',
      description: 'Fee management, invoicing, and payment processing',
      author: 'EduMyles Team',
      category: 'financial',
      icon: '💰',
      manifest: {
        dependencies: [],
        permissions: ['financial:*'],
        apiEndpoints: [
          { path: '/api/fees', method: 'GET', handler: 'getFees' },
          { path: '/api/payments', method: 'POST', handler: 'processPayment' },
        ],
        dashboardWidgets: [
          { id: 'financial-overview', title: 'Financial Overview', component: 'FinancialOverview', size: 'large' },
        ],
        navigationItems: [
          { id: 'fees', title: 'Fee Management', path: '/fees', icon: '💵' },
          { id: 'payments', title: 'Payments', path: '/payments', icon: '💳' },
        ]
      },
      pricing: {
        type: 'subscription',
        price: 49,
        currency: 'USD',
        billingCycle: 'monthly'
      }
    },
    {
      id: 'communication-hub',
      name: 'Communication Hub',
      version: '1.0.0',
      description: 'Messaging, announcements, and notifications',
      author: 'EduMyles Team',
      category: 'communication',
      icon: '📢',
      manifest: {
        dependencies: [],
        permissions: ['communication:*'],
        apiEndpoints: [
          { path: '/api/messages', method: 'GET', handler: 'getMessages' },
          { path: '/api/announcements', method: 'POST', handler: 'createAnnouncement' },
        ],
        dashboardWidgets: [
          { id: 'recent-messages', title: 'Recent Messages', component: 'RecentMessages', size: 'medium' },
        ],
        navigationItems: [
          { id: 'messages', title: 'Messages', path: '/messages', icon: '💬' },
          { id: 'announcements', title: 'Announcements', path: '/announcements', icon: '📣' },
        ]
      },
      pricing: {
        type: 'subscription',
        price: 29,
        currency: 'USD',
        billingCycle: 'monthly'
      }
    }
  ];

  for (const moduleData of coreModules) {
    await prisma.module.upsert({
      where: {
        id_version: {
          id: moduleData.id,
          version: moduleData.version
        }
      },
      update: {},
      create: moduleData,
    });

    // Install the academic management module by default
    if (moduleData.id === 'academic-management') {
      await prisma.moduleInstallation.upsert({
        where: {
          tenantId_moduleId: {
            tenantId: demoTenant.id,
            moduleId: moduleData.id
          }
        },
        update: {},
        create: {
          tenantId: demoTenant.id,
          moduleId: moduleData.id,
          version: moduleData.version,
          status: 'INSTALLED',
          config: {}
        },
      });
    }
  }

  // Create basic academic structure
  console.log('Creating academic structure...');
  const academicYear = await prisma.academicYear.upsert({
    where: {
      tenantId_name: {
        tenantId: demoTenant.id,
        name: '2024-2025'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true
    },
  });

  const fallSemester = await prisma.semester.upsert({
    where: {
      tenantId_academicYearId_name: {
        tenantId: demoTenant.id,
        academicYearId: academicYear.id,
        name: 'Fall 2024'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      name: 'Fall 2024',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-20'),
      isActive: true
    },
  });

  const grade10 = await prisma.grade.upsert({
    where: {
      tenantId_name: {
        tenantId: demoTenant.id,
        name: 'Grade 10'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: 'Grade 10',
      level: 10,
      description: 'Tenth grade / Sophomore year'
    },
  });

  const classA = await prisma.class.upsert({
    where: {
      tenantId_gradeId_semesterId_name: {
        tenantId: demoTenant.id,
        gradeId: grade10.id,
        semesterId: fallSemester.id,
        name: 'Section A'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      gradeId: grade10.id,
      semesterId: fallSemester.id,
      name: 'Section A',
      capacity: 30
    },
  });

  await prisma.subject.upsert({
    where: {
      tenantId_gradeId_code: {
        tenantId: demoTenant.id,
        gradeId: grade10.id,
        code: 'MATH101'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      gradeId: grade10.id,
      name: 'Mathematics',
      code: 'MATH101',
      description: 'Algebra and Geometry',
      credits: 4,
      color: '#3B82F6'
    },
  });

  await prisma.subject.upsert({
    where: {
      tenantId_gradeId_code: {
        tenantId: demoTenant.id,
        gradeId: grade10.id,
        code: 'ENG101'
      }
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      gradeId: grade10.id,
      name: 'English Literature',
      code: 'ENG101',
      description: 'Literature and composition',
      credits: 4,
      color: '#EF4444'
    },
  });

  // Create extended profiles
  console.log('Creating extended profiles...');
  const tenantUserStudent = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: student.id
      }
    }
  });

  if (tenantUserStudent) {
    await prisma.studentProfile.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        tenantId: demoTenant.id,
        userId: student.id,
        studentId: 'STU2024001',
        admissionDate: new Date('2024-08-15'),
        currentGrade: 'Grade 10',
        section: 'Section A',
        rollNumber: '001',
        medicalInfo: {
          bloodGroup: 'O+',
          allergies: [],
          medications: [],
          medicalConditions: [],
        },
        academicInfo: {
          subjects: ['MATH101', 'ENG101'],
          specialNeeds: [],
          achievements: []
        },
      },
    });
  }

  const tenantUserTeacher = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: teacher.id
      }
    }
  });

  if (tenantUserTeacher) {
    await prisma.teacherProfile.upsert({
      where: { userId: teacher.id },
      update: {},
      create: {
        tenantId: demoTenant.id,
        userId: teacher.id,
        employeeId: 'EMP2024001',
        hireDate: new Date('2024-07-01'),
        department: 'Mathematics',
        experience: 5,
        subjects: ['MATH101'],
        qualifications: [
          {
            degree: 'Masters in Mathematics',
            institution: 'State University',
            year: 2019,
            grade: 'A'
          }
        ],
        workSchedule: {
          workingDays: [1, 2, 3, 4, 5], // Monday to Friday
          startTime: '08:00',
          endTime: '15:00'
        }
      },
    });
  }

  const tenantUserParent = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: parent.id
      }
    }
  });

  if (tenantUserParent) {
    await prisma.parentProfile.upsert({
      where: { userId: parent.id },
      update: {},
      create: {
        tenantId: demoTenant.id,
        userId: parent.id,
        relationship: 'mother',
        occupation: 'Engineer',
        workplace: 'Tech Corp',
        children: [student.id]
      },
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📧 Demo Accounts:');
  console.log('Super Admin: admin@edumyles.com / admin123!');
  console.log('School Admin: admin@demo.edumyles.com / admin123!');
  console.log('Principal: principal@demo.edumyles.com / principal123!');
  console.log('Teacher: teacher@demo.edumyles.com / teacher123!');
  console.log('Student: student@demo.edumyles.com / student123!');
  console.log('Parent: parent@demo.edumyles.com / parent123!');
  console.log('\n🌐 Demo URL: https://demo.edumyles.com');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });