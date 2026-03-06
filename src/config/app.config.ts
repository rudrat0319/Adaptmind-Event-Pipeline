import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Student } from '../entities/StudentEntity';
import { Mission } from '../entities/MissionEntity';
import { MissionAttempt } from '../entities/MssionAttemptEntity';
import { LearningMetrics } from '../entities/LearningMetricsEntity';
import { RiskAlert } from '../entities/RiskAlertEntity';
import { IdempotencyKey } from '../entities/IdempotencyKeyEntity';

dotenv.config();

export function validateConfig(): void {
  const required = [
    'DATABASE_URL',
    'RABBITMQ_URL',
    'N8N_WEBHOOK_URL',
    'N8N_WEBHOOK_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Missing required environment variables:\n - ${missing.join('\n - ')}`
    );
  }

  console.log('[Config] All required environment variables are present. ✅');
}

export const AppConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  
  validateEnvironment: validateConfig,
  
  createDataSource(): DataSource {
    return new DataSource({
      type: 'postgres',
      url: DbConfig.url,
      entities: [
        Student,
        Mission,
        MissionAttempt,
        LearningMetrics,
        RiskAlert,
        IdempotencyKey,
      ],
      synchronize: false,
      logging: this.nodeEnv === 'development',
      ssl: this.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    });
  },
};

export const DbConfig = {
  url: process.env.DATABASE_URL ?? '',
};

export const QueueConfig = {
  url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  exchange: process.env.RABBITMQ_EXCHANGE ?? 'adaptmind.events',
  missionQueue: process.env.RABBITMQ_QUEUE_MISSION ?? 'mission.completed',
  notificationQueue: process.env.RABBITMQ_QUEUE_NOTIFICATION ?? 'notification.dispatch',
};

export const ExternalConfig = {
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL ?? '',
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET ?? '',
  webhookRetryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS ?? '3', 10),
  webhookRetryBaseDelayMs: parseInt(process.env.WEBHOOK_RETRY_BASE_DELAY_MS ?? '1000', 10),
};
