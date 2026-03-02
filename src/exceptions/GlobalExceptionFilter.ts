import { EntityNotFoundException } from './EntityNotFoundException';
import { IdempotencyException } from './IdempotencyException';
import { InfrastructureException } from './InfrastructureException';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

export class GlobalExceptionFilter {
  static handle(error: Error): ErrorResponse {
    const timestamp = new Date().toISOString();

    if (error instanceof EntityNotFoundException) {
      return {
        statusCode: error.statusCode,
        message: error.message,
        error: 'Not Found',
        timestamp,
      };
    }

    if (error instanceof IdempotencyException) {
      return {
        statusCode: error.statusCode,
        message: error.message,
        error: 'Conflict',
        timestamp,
      };
    }

    if (error instanceof InfrastructureException) {
      return {
        statusCode: error.statusCode,
        message: error.message,
        error: 'Internal Server Error',
        timestamp,
      };
    }

    // Default error handling
    return {
      statusCode: 500,
      message: error.message || 'Internal server error',
      error: 'Internal Server Error',
      timestamp,
    };
  }
}
