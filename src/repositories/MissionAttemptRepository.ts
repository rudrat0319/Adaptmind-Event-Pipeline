import { DataSource, Repository } from 'typeorm';
import { MissionAttempt } from '../entities/MssionAttemptEntity';

export class MissionAttemptRepository extends Repository<MissionAttempt> {
  constructor(dataSource: DataSource) {
    super(MissionAttempt, dataSource.createEntityManager());
  }
}
