import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppConfig } from '../config/app.config';
import { Student } from '../entities/StudentEntity';
import { Mission } from '../entities/MissionEntity';
import { LearningMetrics } from '../entities/LearningMetricsEntity';

dotenv.config();

async function seed() {
  try {
    const dataSource = AppConfig.createDataSource();
    await dataSource.initialize();
    console.log('Database connected');

    // Create sample student
    const studentRepo = dataSource.getRepository(Student);
    const existingStudent = await studentRepo.findOne({ where: { name: 'Alice Johnson' } });

    let student: Student;
    if (existingStudent) {
      console.log('Student already exists, skipping...');
      student = existingStudent;
    } else {
      student = studentRepo.create({
        name: 'Alice Johnson',
        age: 10,
        parentEmail: 'parent@example.com',
      });
      await studentRepo.save(student);
      console.log('Created student:', student.id);

      // Create learning metrics for the student
      const metricsRepo = dataSource.getRepository(LearningMetrics);
      const metrics = metricsRepo.create({
        studentId: student.id,
        logicScore: 50,
        ethicsScore: 50,
        aiOrchestrationScore: 50,
      });
      await metricsRepo.save(metrics);
      console.log('Created learning metrics for student');
    }

    // Create sample missions
    const missionRepo = dataSource.getRepository(Mission);
    
    const missions = [
      {
        id: 'ai-ethics-1',
        title: 'Introduction to AI Ethics',
        difficulty: 1,
        energyCost: 10,
      },
      {
        id: 'logic-puzzle-1',
        title: 'Basic Logic Puzzle',
        difficulty: 2,
        energyCost: 15,
      },
      {
        id: 'orchestration-1',
        title: 'AI Orchestration Basics',
        difficulty: 3,
        energyCost: 20,
      },
    ];

    for (const missionData of missions) {
      const existing = await missionRepo.findOne({ where: { id: missionData.id } });
      if (!existing) {
        const mission = missionRepo.create(missionData);
        await missionRepo.save(mission);
        console.log('Created mission:', mission.id);
      } else {
        console.log('Mission already exists:', missionData.id);
      }
    }

    console.log('\n✅ Seed data created successfully!');
    console.log('\nTest the API with:');
    console.log(`curl -X POST http://localhost:3000/mission-complete \\
  -H "Content-Type: application/json" \\
  -d '{
    "student_id": "${student.id}",
    "mission_id": "ai-ethics-1",
    "score": 85,
    "time_taken": 120,
    "hints_used": 1
  }'`);

    await dataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
