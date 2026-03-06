import { LearningMetrics } from '../entities/LearningMetricsEntity';
import { MissionCompleteRequestDto } from '../dtos/MissionCompleteRequestDto';

export class ScoringService {
  
  calculateUpdatedMetrics(
    currentMetrics: { sustainabilityUnderstanding: number; energyEfficiencyScore: number; decisionConfidence: number },
    missionData: MissionCompleteRequestDto
  ): { sustainabilityUnderstanding: number; energyEfficiencyScore: number; decisionConfidence: number } {
    let sustainabilityUnderstanding = currentMetrics.sustainabilityUnderstanding;
    let energyEfficiencyScore = currentMetrics.energyEfficiencyScore;
    let decisionConfidence = currentMetrics.decisionConfidence;

    if (missionData.score > 80) {
      sustainabilityUnderstanding += 5;
      energyEfficiencyScore += 3;
    }

    if (missionData.energyUsed < 15) {
      energyEfficiencyScore += 5;
    }

    decisionConfidence = Math.max(
      decisionConfidence,
      missionData.learningMetrics.decisionConfidence * 100
    );

    sustainabilityUnderstanding = Math.max(0, Math.min(100, sustainabilityUnderstanding));
    energyEfficiencyScore = Math.max(0, Math.min(100, energyEfficiencyScore));
    decisionConfidence = Math.max(0, Math.min(100, decisionConfidence));

    return {
      sustainabilityUnderstanding,
      energyEfficiencyScore,
      decisionConfidence,
    };
  }
}
