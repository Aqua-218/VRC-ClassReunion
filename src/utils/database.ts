import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Prisma Client singleton instance
 * Ensures only one database connection is maintained throughout the application lifecycle
 */
class DatabaseClient {
  private static instance: PrismaClient | null = null;

  /**
   * Get or create the Prisma Client instance
   * Implements singleton pattern to prevent multiple database connections
   *
   * @returns Prisma Client instance
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      });

      logger.info('Database client initialized', {
        environment: env.NODE_ENV,
      });
    }

    return DatabaseClient.instance;
  }

  /**
   * Connect to the database
   * Should be called during application startup
   */
  public static async connect(): Promise<void> {
    const client = DatabaseClient.getInstance();

    try {
      await client.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Disconnect from the database
   * Should be called during graceful shutdown
   */
  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.instance = null;
      logger.info('Database disconnected');
    }
  }

  /**
   * Health check for database connection
   * Executes a simple query to verify connection is alive
   *
   * @returns true if database is accessible, false otherwise
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Export singleton instance getter
 */
export const db = DatabaseClient.getInstance();

/**
 * Export utility functions
 */
export const connectDatabase = DatabaseClient.connect;
export const disconnectDatabase = DatabaseClient.disconnect;
export const checkDatabaseHealth = DatabaseClient.healthCheck;
