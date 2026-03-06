import { DecisionDto } from './MissionCompleteRequestDto';

export interface N8nPayloadDto {
  student_id: string;
  student_name: string;
  parent_email: string;
  mission_id: string;
  mission_title: string;
  score: number;
  time_taken: number;
  energy_used: number;
  decisions: DecisionDto[];
  sustainability_understanding: number;
  energy_efficiency_score: number;
  decision_confidence: number;
  completed_at: string;
}
