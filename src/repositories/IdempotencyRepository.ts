import { DataSource, Repository } from 'typeorm';
import { IdempotencyKey } from '../entities/IdempotencyKeyEntity';

export class IdempotencyRepository extends Repository<IdempotencyKey> {
  constructor(dataSource: DataSource) {
    super(IdempotencyKey, dataSource.createEntityManager());
  }

  async exists(requestId: string): Promise<boolean> {
    const count = await this.count({ where: { id: requestId } });
    return count > 0;
  }
}
