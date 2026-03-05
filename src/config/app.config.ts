import { DataSource } from 'typeorm';
import { Student } from '../entities/StudentEntity';
import { Mission } from '../entities/MissionEntity';
import { MissionAttempt } from '../entities/MssionAttemptEntity';
import { LearningMetrics } from '../entities/LearningMetricsEntity';
import { RiskAlert } from '../entities/RiskAlertEntity';
import { IdempotencyKey } from '../entities/IdempotencyKeyEntity';

export class AppConfig {
  static createDataSource(): DataSource {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    return new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [
        Student,
        Mission,
        MissionAttempt,
        LearningMetrics,
        RiskAlert,
        IdempotencyKey,
      ],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  static validateEnvironment(): void {
    const required = ['DATABASE_URL'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (!process.env.N8N_WEBHOOK_URL) {
      console.warn('Warning: N8N_WEBHOOK_URL not set. Webhook notifications will be disabled.');
    }

    if (!process.env.RABBITMQ_URL) {
      console.warn('Warning: RABBITMQ_URL not set. Using default: amqp://localhost:5672');
    }
  }
}

