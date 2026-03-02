import { DataSource, Repository } from 'typeorm';
import { Mission } from '../entities/MissionEntity';

export class MissionRepository extends Repository<Mission> {
  constructor(dataSource: DataSource) {
    super(Mission, dataSource.createEntityManager());
  }
}
