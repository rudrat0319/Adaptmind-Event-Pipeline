export interface MissionCompleteResponseDto {
  success: boolean;
  message: string;
  data?: {
    attemptId: string;
    updatedMetrics: {
      sustainabilityUnderstanding: number;
      energyEfficiencyScore: number;
      decisionConfidence: number;
    };
  };
}
