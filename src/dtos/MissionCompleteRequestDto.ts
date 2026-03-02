export interface MissionCompleteRequestDto {
  student_id: string;
  mission_id: string;
  score: number;
  time_taken: number;
  hints_used: number;
  request_id?: string; // For idempotency
}
