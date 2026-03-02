import { DataSource, Repository } from 'typeorm';
import { RiskAlert } from '../entities/RiskAlertEntity';

export class RiskAlertRepository extends Repository<RiskAlert> {
  constructor(dataSource: DataSource) {
    super(RiskAlert, dataSource.createEntityManager());
  }
}
