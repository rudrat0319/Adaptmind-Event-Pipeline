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

  @Column({ name: 'hints_used', type: 'integer', default: 0 })
  hintsUsed!: number;

  @CreateDateColumn({ name: 'completed_at', type: 'timestamptz' })
  completedAt!: Date;

  @ManyToOne(() => Student, (student) => student.missionAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => Mission, (mission) => mission.missionAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id' })
  mission!: Mission;
}
