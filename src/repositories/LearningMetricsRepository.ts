import { DataSource, Repository } from 'typeorm';
import { LearningMetrics } from '../entities/LearningMetricsEntity';

export class LearningMetricsRepository extends Repository<LearningMetrics> {
  constructor(dataSource: DataSource) {
    super(LearningMetrics, dataSource.createEntityManager());
  }

  async findByStudentId(studentId: string): Promise<LearningMetrics | null> {
    return this.findOne({ where: { studentId } });
  }
}
