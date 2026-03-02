import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { MissionAttempt } from './MssionAttemptEntity';
import { RiskAlert } from './RiskAlertEntity';

@Entity('missions')
export class Mission {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'integer' })
  difficulty!: number;

  @Column({ name: 'energy_cost', type: 'integer', default: 10 })
  energyCost!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => MissionAttempt, (attempt) => attempt.mission)
  missionAttempts!: MissionAttempt[];

  @OneToMany(() => RiskAlert, (alert) => alert.mission)
  riskAlerts!: RiskAlert[];
}
