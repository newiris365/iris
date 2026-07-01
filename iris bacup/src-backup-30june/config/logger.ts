import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Custom log format with timestamp, level, and message
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// Console transport (colorized for development, JSON for production)
const consoleTransport = new winston.transports.Console({
  format: isProduction
    ? winston.format.combine(logFormat, winston.format.json())
    : winston.format.combine(
        logFormat,
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, metadata }) => {
          const meta = Object.keys(metadata as any || {}).length ? ` ${JSON.stringify(metadata)}` : '';
          return `${timestamp} [${level}]: ${message}${meta}`;
        })
      )
});

// File transport for persistent error logs
const fileTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  format: winston.format.combine(logFormat, winston.format.json()),
  maxsize: 5 * 1024 * 1024, // 5MB max file size
  maxFiles: 5
});

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports: [consoleTransport, fileTransport],
  // Do not exit on uncaught exceptions
  exitOnError: false
});

export default logger;
