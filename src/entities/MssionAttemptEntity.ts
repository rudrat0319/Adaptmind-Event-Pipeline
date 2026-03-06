import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './StudentEntity';
import { Mission } from './MissionEntity';

@Entity('mission_attempts')
export class MissionAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'mission_id', type: 'varchar', length: 50 })
  missionId!: string;

  @Column({ type: 'integer' })
  score!: number;

  @Column({ name: 'time_taken', type: 'integer' })
  timeTaken!: number;

  @Column({ name: 'energy_used', type: 'integer' })
  energyUsed!: number;

  @Column({ type: 'jsonb', nullable: true })
  decisions!: object;

  @Column({ name: 'device_platform', type: 'varchar', length: 50, nullable: true })
  devicePlatform!: string;

  @Column({ name: 'device_app_version', type: 'varchar', length: 20, nullable: true })
  deviceAppVersion!: string;

  @CreateDateColumn({ name: 'completed_at', type: 'timestamptz' })
  completedAt!: Date;

  @ManyToOne(() => Student, (student) => student.missionAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => Mission, (mission) => mission.missionAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id' })
  mission!: Mission;
}
