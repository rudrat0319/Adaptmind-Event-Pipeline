import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './StudentEntity';
import { Mission } from './MissionEntity';

@Entity('risk_alerts')
export class RiskAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'mission_id', type: 'varchar', length: 50, nullable: true })
  missionId!: string | null;

  @Column({ type: 'integer' })
  score!: number;

  @Column({ name: 'alert_reason', type: 'text' })
  alertReason!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Student, (student) => student.riskAlerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => Mission, (mission) => mission.riskAlerts)
  @JoinColumn({ name: 'mission_id' })
  mission!: Mission | null;
}
