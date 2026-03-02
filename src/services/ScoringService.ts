import { LearningMetrics } from '../entities/LearningMetricsEntity';
import { MissionCompleteRequestDto } from '../dtos/MissionCompleteRequestDto';

export class ScoringService {
  /**
   * Calculate updated learning metrics based on mission performance
   * Logic:
   * - If score > 80: Increase logic_score by +5
   * - If hints_used > 2: Reduce logic_score by -2
   * - Future: Map mission types to ethics_score and ai_orchestration_score
   */
  calculateUpdatedMetrics(
    currentMetrics: LearningMetrics,
    missionData: MissionCompleteRequestDto
  ): { logicScore: number; ethicsScore: number; aiOrchestrationScore: number } {
    let logicScore = currentMetrics.logicScore;
    let ethicsScore = currentMetrics.ethicsScore;
    let aiOrchestrationScore = currentMetrics.aiOrchestrationScore;

    // Apply logic score adjustments
    if (missionData.score > 80) {
      logicScore += 5;
    }

    if (missionData.hints_used > 2) {
      logicScore -= 2;
    }

    // Ensure scores stay within bounds [0, 100]
    logicScore = Math.max(0, Math.min(100, logicScore));
    ethicsScore = Math.max(0, Math.min(100, ethicsScore));
    aiOrchestrationScore = Math.max(0, Math.min(100, aiOrchestrationScore));

    return {
      logicScore,
      ethicsScore,
      aiOrchestrationScore,
    };
  }
}
