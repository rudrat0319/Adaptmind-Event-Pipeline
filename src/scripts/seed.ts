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

      const metricsRepo = dataSource.getRepository(LearningMetrics);
      const metrics = metricsRepo.create({
        studentId: student.id,
        sustainabilityUnderstanding: 50,
        energyEfficiencyScore: 50,
        decisionConfidence: 50,
      });
      await metricsRepo.save(metrics);
      console.log('Created learning metrics for student');
    }

    const missionRepo = dataSource.getRepository(Mission);
    
    const missions = [
      {
        id: 'mission_1A',
        title: 'Energy Source Selection Challenge',
        difficulty: 1,
        energyCost: 10,
      },
      {
        id: 'mission_2B',
        title: 'Sustainable Power Grid Design',
        difficulty: 2,
        energyCost: 15,
      },
      {
        id: 'mission_3C',
        title: 'Advanced Energy Optimization',
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
    "eventId": "evt_test_001",
    "timestamp": "2026-03-06T10:30:00Z",
    "studentId": "${student.id}",
    "missionId": "mission_1A",
    "missionAttemptId": "attempt_test_001",
    "score": 92,
    "energyUsed": 17,
    "timeTakenSeconds": 540,
    "decisions": [
      {"step": "energy_source_selection", "choice": "solar"},
      {"step": "backup_power", "choice": "battery"}
    ],
    "learningMetrics": {
      "sustainabilityUnderstanding": 0.90,
      "energyEfficiencyScore": 0.88,
      "decisionConfidence": 0.85
    },
    "device": {
      "platform": "android",
      "appVersion": "1.0.0"
    }
  }'`);

    await dataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
