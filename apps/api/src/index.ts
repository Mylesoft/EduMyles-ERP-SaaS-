import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDatabase } from '@edumyles/database';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { tenantMiddleware } from './middleware/tenant';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';
import { eventBus } from './services/event-bus';

// Import routes
import authRoutes from './routes/auth';
import tenantRoutes from './routes/tenant';
import moduleRoutes from './routes/module';
import userRoutes from './routes/user';
import academicRoutes from './routes/academic';
import studentRoutes from './routes/student';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { isDatabaseHealthy } = await import('@edumyles/database');
    const dbHealthy = await isDatabaseHealthy();
    
    // Check Redis connection (event bus)
    const redisHealthy = await eventBus.isHealthy();

    const status = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
    
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        eventBus: redisHealthy ? 'healthy' : 'unhealthy',
      },
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
    });
  }
});

// API Routes (protected by tenant middleware)
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantMiddleware, tenantRoutes);
app.use('/api/modules', tenantMiddleware, authMiddleware, moduleRoutes);
app.use('/api/users', tenantMiddleware, authMiddleware, userRoutes);
app.use('/api/academic', tenantMiddleware, authMiddleware, academicRoutes);
app.use('/api/students', tenantMiddleware, authMiddleware, studentRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await eventBus.disconnect();
    const { disconnectDatabase } = await import('@edumyles/database');
    await disconnectDatabase();
    logger.info('Services disconnected successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await eventBus.disconnect();
    const { disconnectDatabase } = await import('@edumyles/database');
    await disconnectDatabase();
    logger.info('Services disconnected successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to event bus
    await eventBus.connect();
    logger.info('Event bus connected successfully');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 EduMyles API Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

export default app;