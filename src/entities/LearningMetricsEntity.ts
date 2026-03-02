import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Student } from './StudentEntity';

@Entity('learning_metrics')
export class LearningMetrics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid', unique: true })
  studentId!: string;

  @Column({ name: 'logic_score', type: 'integer', default: 50 })
  logicScore!: number;

  @Column({ name: 'ethics_score', type: 'integer', default: 50 })
  ethicsScore!: number;

  @Column({ name: 'ai_orchestration_score', type: 'integer', default: 50 })
  aiOrchestrationScore!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => Student, (student) => student.learningMetrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;
}
