# EduMyles - Modular School Management System

EduMyles is a comprehensive, multi-tenant school management software built with a modular "App Store" architecture. Schools can customize their platform by installing only the modules they need, providing flexibility, cost optimization, and scalable feature adoption.

## 🏗️ Architecture

### Core Principles
- **Modularity**: Each business domain (Academics, Finance, etc.) is a self-contained module
- **Interoperability**: Modules seamlessly share data through a central event bus
- **Customizability**: Tenants only enable and pay for the modules they use
- **Extensibility**: Developer SDK allows for creation of third-party modules

### Tech Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multi-tenant support
- **Event Bus**: Redis-based pub/sub system
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
edumyles/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # Express.js backend API
├── packages/
│   ├── database/            # Prisma schema and migrations
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared TypeScript types
│   ├── modules/             # Core and optional modules
│   └── sdk/                 # Developer SDK for third-party modules
├── modules/
│   ├── academic/            # Academic Management Suite
│   ├── financial/           # Financial Management
│   ├── communication/       # Communication Hub
│   ├── lms/                # Learning Management System
│   └── gamification/        # Gamification Engine
├── docker/                  # Docker configurations
├── docs/                    # Documentation
└── scripts/                 # Build and deployment scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd edumyles
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Configure your database and other settings
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start the development servers:
```bash
npm run dev
```

## 🏪 Module System

EduMyles uses a unique modular architecture where functionality is divided into installable modules:

### Core Platform (Always Available)
- Authentication & User Management
- Tenant Management
- Basic Dashboard
- App Store Interface
- Module Orchestration Engine
- Inter-Module Communication Bus

### Optional Modules (App Store)
- **Academic Management**: SIS, Gradebook, Attendance, Curriculum
- **Financial Management**: Fee Structures, Payment Processing, Invoicing
- **Communication Hub**: Messaging, Notifications, Announcements
- **Learning Management System**: Course delivery, assignments, assessments
- **Gamification Engine**: Points, badges, leaderboards
- **Third-Party Integrations**: Google Workspace, Microsoft 365, Canvas LMS

## 🔧 Development

### Creating a New Module

1. Use the module generator:
```bash
npm run create:module my-module
```

2. Implement the module interface:
```typescript
export const myModule: EduMylesModule = {
  id: 'my-module',
  name: 'My Module',
  version: '1.0.0',
  description: 'Description of my module',
  dependencies: [],
  permissions: [],
  apiEndpoints: [],
  onInstall: async () => { /* setup logic */ },
  onUninstall: async () => { /* cleanup logic */ }
};
```

3. Register event handlers and API endpoints as needed

### Running Tests
```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:coverage # Coverage report
```

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [Module Development Guide](docs/module-development.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 About

EduMyles is developed by Myles Corp Ltd, focusing on providing modern, scalable educational technology solutions.