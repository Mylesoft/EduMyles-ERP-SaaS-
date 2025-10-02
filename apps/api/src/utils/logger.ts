import winston from 'winston';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors 
winston.addColors(logColors);

// Format for development (console)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  }),
);

// Format for production (structured JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Determine log format based on environment
const logFormat = process.env.NODE_ENV === 'development' ? devFormat : prodFormat;

// Define which transports to use
const transports: winston.transport[] = [];

// Always log to console
transports.push(
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    format: logFormat,
  })
);

// In production, also log to files
if (process.env.NODE_ENV === 'production') {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: prodFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: prodFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels: logLevels,
  format: logFormat,
  transports,
  // Do not exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: prodFormat,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: prodFormat,
    })
  );
}

// Create a stream object for Morgan HTTP request logging
const stream = {
  write: (message: string) => {
    logger.http(message.substring(0, message.lastIndexOf('\n')));
  },
};

// Helper functions for structured logging
const createLogMessage = (message: string, metadata?: any) => {
  if (metadata && typeof metadata === 'object') {
    return { message, ...metadata };
  }
  return message;
};

// Export enhanced logger with helper methods
export const logger = {
  error: (message: string, metadata?: any) => {
    logger.error(createLogMessage(message, metadata));
  },
  
  warn: (message: string, metadata?: any) => {
    logger.warn(createLogMessage(message, metadata));
  },
  
  info: (message: string, metadata?: any) => {
    logger.info(createLogMessage(message, metadata));
  },
  
  http: (message: string, metadata?: any) => {
    logger.http(createLogMessage(message, metadata));
  },
  
  debug: (message: string, metadata?: any) => {
    logger.debug(createLogMessage(message, metadata));
  },

  // Special methods for common use cases
  audit: (action: string, metadata?: any) => {
    logger.info(`AUDIT: ${action}`, { 
      type: 'audit',
      action,
      ...metadata 
    });
  },

  security: (event: string, metadata?: any) => {
    logger.warn(`SECURITY: ${event}`, { 
      type: 'security',
      event,
      ...metadata 
    });
  },

  performance: (operation: string, duration: number, metadata?: any) => {
    logger.info(`PERFORMANCE: ${operation} took ${duration}ms`, { 
      type: 'performance',
      operation,
      duration,
      ...metadata 
    });
  },

  stream,
};

export default logger;