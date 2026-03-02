import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { MissionAttempt } from './MssionAttemptEntity';
import { LearningMetrics } from './LearningMetricsEntity';
import { RiskAlert } from './RiskAlertEntity';
import { IdempotencyKey } from './IdempotencyKeyEntity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'integer' })
  age!: number;

  @Column({ name: 'parent_email', type: 'varchar', length: 255 })
  parentEmail!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => MissionAttempt, (attempt) => attempt.student)
  missionAttempts!: MissionAttempt[];

  @OneToOne(() => LearningMetrics, (metrics) => metrics.student)
  learningMetrics!: LearningMetrics;

  @OneToMany(() => RiskAlert, (alert) => alert.student)
  riskAlerts!: RiskAlert[];

  @OneToMany(() => IdempotencyKey, (key) => key.student)
  idempotencyKeys!: IdempotencyKey[];
}
