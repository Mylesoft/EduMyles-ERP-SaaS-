# 🎓 EduMyles - Modern School Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

A comprehensive, multi-tenant school management system with modular architecture. Built for scalability, security, and modern educational institutions.

## 🌟 Key Features

- **🏢 Multi-Tenant Architecture** - Complete data isolation for multiple schools
- **🧩 Modular System** - Install only the modules you need
- **🔐 Enterprise Security** - JWT authentication, RBAC, audit logging
- **⚡ Modern Tech Stack** - Next.js 14, TypeScript, Prisma, PostgreSQL
- **📱 Responsive Design** - Mobile-first UI with Tailwind CSS
- **🔄 Event-Driven** - Redis-based event bus for module communication
- **📊 Comprehensive Database** - 20+ models covering all school operations

---

## 📁 Project Structure

```
edumyles/
├── apps/
│   ├── web/                    # Next.js 14 Frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React components
│   │   │   ├── contexts/      # React contexts
│   │   │   └── lib/           # Utilities
│   │   └── package.json
│   │
│   └── api/                    # Express.js Backend
│       ├── src/
│       │   ├── routes/        # API endpoints
│       │   ├── middleware/    # Auth, tenant, error handling
│       │   ├── services/      # Business logic
│       │   └── index.ts       # Server entry point
│       └── package.json
│
├── packages/
│   ├── database/              # Prisma ORM
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Database schema
│   │   │   └── seed.ts        # Seed data
│   │   └── src/
│   │       └── index.ts       # Database client
│   │
│   └── types/                 # TypeScript Definitions
│       └── src/
│           ├── index.ts       # Type exports
│           ├── user.ts        # User types
│           ├── tenant.ts      # Tenant types
│           ├── module.ts      # Module types
│           └── ...            # More type definitions
│
├── modules/                   # Future module extensions
├── docker/                    # Docker configurations
├── docs/                      # Documentation
└── scripts/                   # Build scripts

```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+ (recommended) or npm
- **PostgreSQL** 14+
- **Redis** 6+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mylesoft/EduMyles.git
   cd EduMyles
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy the example file and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

4. **Set up PostgreSQL**
   ```bash
   # Using Docker (recommended)
   docker run --name edumyles-postgres \
     -e POSTGRES_PASSWORD=yourpassword \
     -e POSTGRES_DB=edumyles \
     -p 5432:5432 \
     -d postgres:15
   ```

5. **Set up Redis**
   ```bash
   # Using Docker
   docker run --name edumyles-redis \
     -p 6379:6379 \
     -d redis:7-alpine
   ```

6. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

7. **Seed demo data**
   ```bash
   pnpm db:seed
   ```

8. **Start development servers**
   ```bash
   pnpm dev
   ```

9. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - API Health: http://localhost:3001/health

---

## 🏗️ Architecture

### Multi-Tenant System

EduMyles uses a **shared database with tenant isolation** approach:
- Single database with tenant-scoped queries
- Subdomain-based tenant routing
- Row-level security for data isolation
- Tenant middleware on all API requests

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 | React framework with App Router |
| **UI** | Tailwind CSS + shadcn/ui | Styling and components |
| **Backend** | Express.js | RESTful API server |
| **Database** | PostgreSQL + Prisma | Relational database and ORM |
| **Event Bus** | Redis | Inter-module communication |
| **Auth** | JWT | Stateless authentication |
| **Build** | Turbo | Monorepo build system |
| **Language** | TypeScript | Type safety |

### Database Schema

**Core Models:**
- `Tenant` - School/organization information
- `User` - Global user accounts
- `TenantUser` - User-tenant relationships with roles
- `Session` - Authentication sessions
- `Module` - Available modules
- `ModuleInstallation` - Installed modules per tenant
- `Permission` - Permission definitions
- `RolePermission` - Role-based access control

**Academic Models:**
- `AcademicYear` - School years
- `Semester` - Academic terms
- `Grade` - Grade levels
- `Class` - Class sections
- `Subject` - Course subjects
- `StudentProfile` - Student information
- `TeacherProfile` - Teacher information
- `ParentProfile` - Parent/guardian information

**System Models:**
- `Event` - Event log for module communication
- `EventSubscription` - Module event subscriptions
- `AuditLog` - Audit trail for all operations

---

## 👥 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Super Admin** | Platform administrator | Full system access |
| **Tenant Admin** | School administrator | Full tenant access |
| **Principal** | School principal | School management |
| **Vice Principal** | Assistant principal | Limited management |
| **Teacher** | Teaching staff | Class and student management |
| **Student** | Student account | Personal data access |
| **Parent** | Parent/guardian | Children's data access |
| **Staff** | Support staff | Limited access |
| **Librarian** | Library manager | Library management |
| **Accountant** | Financial staff | Finance management |
| **Nurse** | School nurse | Health records |
| **Security** | Security staff | Basic access |

---

## 🎓 Demo Accounts

After running `pnpm db:seed`, demo accounts will be created.

Check the seed script output for login credentials, or see `packages/database/prisma/seed.ts` for the full list of demo accounts across all roles.

---

## 🧩 Module System

EduMyles uses a modular architecture where features are organized as installable modules:

### Core Platform (Always Available)
- Authentication & Authorization
- User Management
- Tenant Management
- Basic Dashboard
- Settings

### Available Modules

| Module | Description | Status |
|--------|-------------|--------|
| **Academic Management** | Student records, grades, attendance | 🚧 In Development |
| **Financial Management** | Fee management, payments, invoicing | 📋 Planned |
| **Communication Hub** | Messaging, announcements, notifications | 📋 Planned |
| **LMS** | Learning management, assignments, content | 📋 Planned |
| **HR Management** | Staff management, payroll | 📋 Planned |
| **Library Management** | Book tracking, lending | 📋 Planned |
| **Transport** | Bus routes, tracking | 📋 Planned |
| **Gamification** | Achievements, rewards | 📋 Planned |

---

## 🔧 Development Commands

```bash
# Development
pnpm dev                    # Start all services in development mode
pnpm build                  # Build all packages
pnpm type-check             # Run TypeScript type checking
pnpm lint                   # Lint all packages
pnpm format                 # Format code with Prettier

# Database
pnpm db:migrate             # Run database migrations
pnpm db:seed                # Seed database with demo data
pnpm db:studio              # Open Prisma Studio (database GUI)
pnpm db:reset               # Reset database (careful!)

# Specific packages
pnpm --filter @edumyles/web dev      # Run only frontend
pnpm --filter @edumyles/api dev      # Run only backend
pnpm --filter @edumyles/database build  # Build database package
```

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Register (if enabled)
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/logout             # Logout
```

### Tenant Management
```
GET    /api/tenant/info             # Get tenant information
GET    /api/tenant/settings         # Get tenant settings (auth required)
```

### User Management
```
GET    /api/users/profile           # Get current user profile
```

### Modules
```
GET    /api/modules/installed       # List installed modules
GET    /api/modules/available       # List available modules
```

### Academic
```
GET    /api/academic/years          # Get academic years
```

---

## 🔐 Security Features

- **JWT Authentication** - Stateless token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Role-Based Access Control** - Granular permissions
- **Tenant Isolation** - Data separation between schools
- **Audit Logging** - Track all operations
- **CORS Protection** - Cross-origin request filtering
- **Rate Limiting** - Prevent abuse
- **Helmet.js** - Security headers
- **Input Validation** - Request validation

---

## 🧪 Testing

```bash
# Run all tests (once implemented)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

---

## 🚀 Deployment

### Using Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

**Backend (Railway):**
1. Create new project in Railway
2. Connect GitHub repository
3. Add PostgreSQL and Redis services
4. Set environment variables
5. Deploy

### Using Docker

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/schema.md)
- [Module Development](docs/module-development.md)
- [Deployment Guide](docs/deployment.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

Copyright © 2024 Myles Corp Ltd. All rights reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.

---

## 🆘 Support

- **Email**: support@mylescorp.com
- **Documentation**: https://docs.edumyles.com
- **Issues**: https://github.com/Mylesoft/EduMyles/issues

---

## 🗺️ Roadmap

### Q4 2024
- ✅ Core platform foundation
- ✅ Multi-tenant architecture
- ✅ Authentication system
- 🚧 Academic Management module
- 📋 Financial Management module

### Q1 2025
- 📋 Communication Hub
- 📋 LMS module
- 📋 Mobile app (React Native)
- 📋 Advanced reporting

### Q2 2025
- 📋 AI-powered insights
- 📋 Third-party integrations
- 📋 Parent mobile app
- 📋 Teacher mobile app

---

## ⭐ Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Turbo](https://turbo.build/)

---

**EduMyles** - Transforming Educational Management 🎓✨
