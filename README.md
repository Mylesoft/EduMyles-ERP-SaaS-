# EduMyles - Comprehensive School Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

A modern, full-stack school management system designed specifically for African learning institutions. EduMyles provides a comprehensive solution for managing students, teachers, courses, assessments, and administrative tasks in educational environments.

## 🌟 Features

### Core Functionality
- **Multi-tenant Architecture** - Support for multiple schools/institutions
- **Student Management** - Enrollment, profiles, academic records
- **Teacher Management** - Staff profiles, assignments, performance tracking
- **Course & Curriculum Management** - Subject planning, scheduling, materials
- **Assessment & Grading** - Exams, assignments, gradebooks
- **Attendance Tracking** - Real-time attendance monitoring
- **Financial Management** - Fee collection, payment processing via Stripe
- **Communication Hub** - Email and SMS notifications via Nodemailer & Twilio

### Advanced Features
- **Real-time Notifications** - Instant updates using Pusher
- **Document Management** - File uploads with Cloudinary integration
- **Report Generation** - PDF reports and analytics
- **Data Import/Export** - Excel and CSV support
- **Mobile Responsive** - Modern, accessible UI design
- **Role-based Access Control** - Secure authentication and authorization

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Knex.js ORM
- **Authentication**: JWT tokens with bcryptjs
- **File Storage**: Cloudinary
- **Payments**: Stripe integration
- **Communication**: Nodemailer (email) + Twilio (SMS)
- **Real-time**: Pusher for live updates
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Heroicons + Lucide React
- **Animations**: Framer Motion
- **Testing**: Vitest

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edumyles
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Create `.env` files in both `backend/` and `frontend/` directories:
   
   **Backend `.env`:**
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/edumyles
   JWT_SECRET=your-jwt-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   STRIPE_SECRET_KEY=your-stripe-secret
   PUSHER_APP_ID=your-pusher-app-id
   PUSHER_KEY=your-pusher-key
   PUSHER_SECRET=your-pusher-secret
   PUSHER_CLUSTER=your-pusher-cluster
   EMAIL_USER=your-email
   EMAIL_PASS=your-email-password
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   ```

4. **Set up the database**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   cd ..
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both the backend API (port 5000) and frontend development server simultaneously.

## 📝 Available Scripts

### Root Level Commands
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both backend and frontend for production
- `npm run install:all` - Install dependencies for root, backend, and frontend
- `npm run test` - Run tests for both backend and frontend

### Backend Commands
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Build backend for production
- `npm run test:backend` - Run backend tests
- `npm run migrate` - Run database migrations
- `npm run rollback` - Rollback last migration
- `npm run seed` - Seed database with sample data

### Frontend Commands
- `npm run dev:frontend` - Start frontend development server
- `npm run build:frontend` - Build frontend for production
- `npm run test:frontend` - Run frontend tests
- `npm run lint` - Run ESLint on frontend code

## 📁 Project Structure

```
edumyles/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Custom middleware
│   │   ├── database/       # Database models and migrations
│   │   └── index.js        # Server entry point
│   ├── knexfile.js         # Database configuration
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand state management
│   │   └── utils/          # Utility functions
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── package.json
├── package.json            # Root package.json with scripts
└── README.md              # This file
```

## 🔧 Development

### Backend Development
The backend API is built with Express.js and provides RESTful endpoints for all school management operations. Key features include:

- **Database Management**: PostgreSQL with Knex.js for migrations and queries
- **Authentication**: JWT-based auth with secure password hashing
- **File Handling**: Image and document uploads via Cloudinary
- **Payment Processing**: Stripe integration for fee collection
- **Communication**: Automated email and SMS notifications

### Frontend Development
The frontend is a modern React application with TypeScript, featuring:

- **Component Architecture**: Reusable, accessible UI components
- **State Management**: Zustand for global state, React Query for server state
- **Form Handling**: React Hook Form with Zod schema validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live notifications and data synchronization

## 🤝 Contributing

We welcome contributions to EduMyles! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow the existing code style and patterns
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**Mylesoft** - *Initial work and development*

## 🌍 About

EduMyles is specifically designed to address the unique needs of African educational institutions, providing:

- **Localized Features**: Currency support, local payment methods, regional compliance
- **Scalable Architecture**: Multi-tenant design supporting multiple schools
- **Affordable Solutions**: Cost-effective school management for emerging markets
- **Community Focus**: Built with feedback from African educators and administrators

---

For questions, support, or feature requests, please open an issue on this repository.
