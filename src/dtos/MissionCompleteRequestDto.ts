export interface DecisionDto {
  step: string;
  choice: string;
}

export interface LearningMetricsDto {
  sustainabilityUnderstanding: number;
  energyEfficiencyScore: number;
  decisionConfidence: number;
}

export interface DeviceDto {
  platform: string;
  appVersion: string;
}

export interface MissionCompleteRequestDto {
  eventId: string;
  timestamp: string;
  studentId: string;
  missionId: string;
  missionAttemptId: string;
  score: number;
  energyUsed: number;
  timeTakenSeconds: number;
  decisions: DecisionDto[];
  learningMetrics: LearningMetricsDto;
  device: DeviceDto;
}
