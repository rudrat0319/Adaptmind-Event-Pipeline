import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Student } from './StudentEntity';

@Entity('learning_metrics')
export class LearningMetrics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid', unique: true })
  studentId!: string;

  @Column({ name: 'sustainability_understanding', type: 'integer', default: 50 })
  sustainabilityUnderstanding!: number;

  @Column({ name: 'energy_efficiency_score', type: 'integer', default: 50 })
  energyEfficiencyScore!: number;

  @Column({ name: 'decision_confidence', type: 'integer', default: 50 })
  decisionConfidence!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => Student, (student) => student.learningMetrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;
}
