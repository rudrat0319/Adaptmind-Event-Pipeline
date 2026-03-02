import { DataSource, Repository } from 'typeorm';
import { Student } from '../entities/StudentEntity';

export class StudentRepository extends Repository<Student> {
  constructor(dataSource: DataSource) {
    super(Student, dataSource.createEntityManager());
  }

  async findByIdWithMetrics(id: string): Promise<Student | null> {
    return this.findOne({
      where: { id },
      relations: ['learningMetrics'],
    });
  }
}
