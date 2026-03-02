export interface MissionCompleteResponseDto {
  success: boolean;
  message: string;
  data?: {
    attemptId: string;
    updatedMetrics: {
      logicScore: number;
      ethicsScore: number;
      aiOrchestrationScore: number;
    };
  };
}
