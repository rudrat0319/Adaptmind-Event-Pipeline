/**
 * Application Module
 * 
 * This file serves as a central registry for the application's components.
 * While we're not using a framework like NestJS, this provides a clear
 * overview of the application structure.
 */

export const AppModule = {
  // Entities
  entities: [
    'StudentEntity',
    'MissionEntity',
    'MissionAttemptEntity',
    'LearningMetricsEntity',
    'RiskAlertEntity',
    'IdempotencyKeyEntity',
  ],

  // Repositories
  repositories: [
    'StudentRepository',
    'MissionRepository',
    'MissionAttemptRepository',
    'LearningMetricsRepository',
    'RiskAlertRepository',
    'IdempotencyRepository',
  ],

  // Services
  services: [
    'ScoringService',
    'NotificationService',
    'RabbitMqService',
  ],

  // Controllers
  controllers: [
    'MissionController',
  ],

  // Workers
  workers: [
    'MissionProcessorWorker',
  ],

  // Exceptions
  exceptions: [
    'EntityNotFoundException',
    'IdempotencyException',
    'InfrastructureException',
    'GlobalExceptionFilter',
  ],
};

export default AppModule;
