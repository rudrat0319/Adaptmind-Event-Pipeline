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

  /**
   * POST /mission-complete
   * Handles mission completion with atomic transaction processing
   */
  async completeMission(request: MissionCompleteRequestDto): Promise<MissionCompleteResponseDto> {
    // Validate request
    this.validateRequest(request);

    const requestId = request.request_id || uuidv4();

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check idempotency
      const idempotencyExists = await queryRunner.manager
        .getRepository('idempotency_keys')
        .findOne({ where: { id: requestId } });

      if (idempotencyExists) {
        throw new IdempotencyException(requestId);
      }

      // 2. Verify student exists
      const student = await queryRunner.manager
        .getRepository('students')
        .findOne({ where: { id: request.student_id } });

      if (!student) {
        throw new EntityNotFoundException('Student', request.student_id);
      }

      // 3. Verify mission exists
      const mission = await queryRunner.manager
        .getRepository('missions')
        .findOne({ where: { id: request.mission_id } });

      if (!mission) {
        throw new EntityNotFoundException('Mission', request.mission_id);
      }

      // 4. Lock and read learning metrics
      const metrics = await queryRunner.manager
        .createQueryBuilder()
        .select('lm')
        .from('learning_metrics', 'lm')
        .where('lm.student_id = :studentId', { studentId: request.student_id })
        .setLock('pessimistic_write')
        .getRawOne();

      if (!metrics) {
        throw new InfrastructureException('Learning metrics not found for student');
      }

      // 5. Calculate updated metrics
      const updatedScores = this.scoringService.calculateUpdatedMetrics(
        {
          logicScore: metrics.logic_score,
          ethicsScore: metrics.ethics_score,
          aiOrchestrationScore: metrics.ai_orchestration_score,
        } as any,
        request
      );

      // 6. Insert mission attempt
      const attemptResult = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('mission_attempts')
        .values({
          student_id: request.student_id,
          mission_id: request.mission_id,
          score: request.score,
          time_taken: request.time_taken,
          hints_used: request.hints_used,
        })
        .returning('id')
        .execute();

      const attemptId = attemptResult.identifiers[0].id;

      // 7. Update learning metrics
      await queryRunner.manager
        .createQueryBuilder()
        .update('learning_metrics')
        .set({
          logic_score: updatedScores.logicScore,
          ethics_score: updatedScores.ethicsScore,
          ai_orchestration_score: updatedScores.aiOrchestrationScore,
          updated_at: new Date(),
        })
        .where('student_id = :studentId', { studentId: request.student_id })
        .execute();

      // 8. Log idempotency key
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('idempotency_keys')
        .values({
          id: requestId,
          student_id: request.student_id,
        })
        .execute();

      // Commit transaction
      await queryRunner.commitTransaction();

      // 9. Publish event to RabbitMQ (async, outside transaction)
      const event: MissionCompletedEvent = {
        student_id: student.id,
        student_name: student.name,
        parent_email: student.parent_email,
        mission_id: mission.id,
        mission_title: mission.title,
        score: request.score,
        time_taken: request.time_taken,
        hints_used: request.hints_used,
        updated_metrics: {
          logic_score: updatedScores.logicScore,
          ethics_score: updatedScores.ethicsScore,
          ai_orchestration_score: updatedScores.aiOrchestrationScore,
        },
        completed_at: new Date().toISOString(),
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
    if (!request.student_id || !request.mission_id) {
      throw new Error('student_id and mission_id are required');
    }

    if (typeof request.score !== 'number' || request.score < 0 || request.score > 100) {
      throw new Error('score must be a number between 0 and 100');
    }

    if (typeof request.time_taken !== 'number' || request.time_taken < 0) {
      throw new Error('time_taken must be a positive number');
    }

    if (typeof request.hints_used !== 'number' || request.hints_used < 0) {
      throw new Error('hints_used must be a non-negative number');
    }
  }
}
