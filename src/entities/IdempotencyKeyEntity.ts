import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './StudentEntity';

@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Student, (student) => student.idempotencyKeys)
  @JoinColumn({ name: 'student_id' })
  student!: Student;
}
