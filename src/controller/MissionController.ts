import { DataSource } from 'typeorm';
import { MissionCompleteRequestDto } from '../dtos/MissionCompleteRequestDto';
import { MissionCompleteResponseDto } from '../dtos/MissionCompleteResponseDto';
import { MissionCompletedEvent } from '../dtos/MissionCompletedEvent';
import { StudentRepository } from '../repositories/StudentRepository';
import { MissionRepository } from '../repositories/MissionRepository';
import { MissionAttemptRepository } from '../repositories/MissionAttemptRepository';
import { LearningMetricsRepository } from '../repositories/LearningMetricsRepository';
import { IdempotencyRepository } from '../repositories/IdempotencyRepository';
import { ScoringService } from '../services/ScoringService';
import { RabbitMqService } from '../services/RabbitMqService';
import { EntityNotFoundException } from '../exceptions/EntityNotFoundException';
import { IdempotencyException } from '../exceptions/IdempotencyException';
import { InfrastructureException } from '../exceptions/InfrastructureException';
import { v4 as uuidv4 } from 'uuid';

export class MissionController {
  private studentRepo: StudentRepository;
  private missionRepo: MissionRepository;
  private attemptRepo: MissionAttemptRepository;
  private metricsRepo: LearningMetricsRepository;
  private idempotencyRepo: IdempotencyRepository;
  private scoringService: ScoringService;
  private rabbitMqService: RabbitMqService;

  constructor(private dataSource: DataSource, rabbitMqService: RabbitMqService) {
    this.studentRepo = new StudentRepository(dataSource);
    this.missionRepo = new MissionRepository(dataSource);
    this.attemptRepo = new MissionAttemptRepository(dataSource);
    this.metricsRepo = new LearningMetricsRepository(dataSource);
    this.idempotencyRepo = new IdempotencyRepository(dataSource);
    this.scoringService = new ScoringService();
    this.rabbitMqService = rabbitMqService;
  }

 
  async completeMission(request: MissionCompleteRequestDto): Promise<MissionCompleteResponseDto> {
    this.validateRequest(request);

    const requestId = request.eventId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const idempotencyExists = await queryRunner.manager
        .getRepository('idempotency_keys')
        .findOne({ where: { id: requestId } });

      if (idempotencyExists) {
        throw new IdempotencyException(requestId);
      }

      const student = await queryRunner.manager
        .getRepository('students')
        .findOne({ where: { id: request.studentId } });

      if (!student) {
        throw new EntityNotFoundException('Student', request.studentId);
      }

      const mission = await queryRunner.manager
        .getRepository('missions')
        .findOne({ where: { id: request.missionId } });

      if (!mission) {
        throw new EntityNotFoundException('Mission', request.missionId);
      }

      const metrics = await queryRunner.manager
        .createQueryBuilder()
        .select('lm')
        .from('learning_metrics', 'lm')
        .where('lm.student_id = :studentId', { studentId: request.studentId })
        .setLock('pessimistic_write')
        .getRawOne();

      if (!metrics) {
        throw new InfrastructureException('Learning metrics not found for student');
      }

      const updatedScores = this.scoringService.calculateUpdatedMetrics(
        {
          sustainabilityUnderstanding: metrics.sustainability_understanding,
          energyEfficiencyScore: metrics.energy_efficiency_score,
          decisionConfidence: metrics.decision_confidence,
        },
        request
      );

      const attemptResult = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('mission_attempts')
        .values({
          id: request.missionAttemptId,
          student_id: request.studentId,
          mission_id: request.missionId,
          score: request.score,
          time_taken: request.timeTakenSeconds,
          energy_used: request.energyUsed,
          decisions: JSON.stringify(request.decisions),
          device_platform: request.device.platform,
          device_app_version: request.device.appVersion,
        })
        .returning('id')
        .execute();

      const attemptId = attemptResult.identifiers[0].id;

      await queryRunner.manager
        .createQueryBuilder()
        .update('learning_metrics')
        .set({
          sustainability_understanding: updatedScores.sustainabilityUnderstanding,
          energy_efficiency_score: updatedScores.energyEfficiencyScore,
          decision_confidence: updatedScores.decisionConfidence,
          updated_at: new Date(),
        })
        .where('student_id = :studentId', { studentId: request.studentId })
        .execute();

      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('idempotency_keys')
        .values({
          id: requestId,
          student_id: request.studentId,
        })
        .execute();

      await queryRunner.commitTransaction();

      const event: MissionCompletedEvent = {
        student_id: student.id,
        student_name: student.name,
        parent_email: student.parent_email,
        mission_id: mission.id,
        mission_title: mission.title,
        score: request.score,
        time_taken: request.timeTakenSeconds,
        energy_used: request.energyUsed,
        decisions: request.decisions,
        updated_metrics: {
          sustainability_understanding: updatedScores.sustainabilityUnderstanding,
          energy_efficiency_score: updatedScores.energyEfficiencyScore,
          decision_confidence: updatedScores.decisionConfidence,
        },
        completed_at: request.timestamp,
      };

      await this.rabbitMqService.publishMissionCompletedEvent(event);

      return {
        success: true,
        message: 'Mission completed successfully',
        data: {
          attemptId,
          updatedMetrics: updatedScores,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private validateRequest(request: MissionCompleteRequestDto): void {
    if (!request.eventId || !request.studentId || !request.missionId || !request.missionAttemptId) {
      throw new Error('eventId, studentId, missionId, and missionAttemptId are required');
    }

    if (typeof request.score !== 'number' || request.score < 0 || request.score > 100) {
      throw new Error('score must be a number between 0 and 100');
    }

    if (typeof request.timeTakenSeconds !== 'number' || request.timeTakenSeconds < 0) {
      throw new Error('timeTakenSeconds must be a positive number');
    }

    if (typeof request.energyUsed !== 'number' || request.energyUsed < 0) {
      throw new Error('energyUsed must be a non-negative number');
    }

    if (!Array.isArray(request.decisions)) {
      throw new Error('decisions must be an array');
    }

    if (!request.learningMetrics || typeof request.learningMetrics !== 'object') {
      throw new Error('learningMetrics is required');
    }

    if (!request.device || !request.device.platform || !request.device.appVersion) {
      throw new Error('device information is required');
    }
  }
}
