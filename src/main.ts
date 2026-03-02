import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppConfig } from './config/app.config';
import { RabbitMqService } from './services/RabbitMqService';
import { MissionController } from './controller/MissionController';
import { GlobalExceptionFilter } from './exceptions/GlobalExceptionFilter';
import * as http from 'http';

// Load environment variables
dotenv.config();

async function bootstrap() {
  try {
    // Validate environment
    AppConfig.validateEnvironment();

    // Initialize database
    const dataSource = AppConfig.createDataSource();
    await dataSource.initialize();
    console.log('Database connected successfully');

    // Initialize RabbitMQ
    const rabbitMqService = new RabbitMqService();
    await rabbitMqService.connect();

    // Initialize controller
    const missionController = new MissionController(dataSource, rabbitMqService);

    // Create HTTP server
    const server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Health check endpoint
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      // Mission complete endpoint
      if (req.url === '/mission-complete' && req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const requestData = JSON.parse(body);
            const response = await missionController.completeMission(requestData);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            const errorResponse = GlobalExceptionFilter.handle(error as Error);
            res.writeHead(errorResponse.statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(errorResponse));
          }
        });

        return;
      }

      // 404 Not Found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', message: 'Endpoint not found' }));
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Mission complete: POST http://localhost:${PORT}/mission-complete`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close();
      await rabbitMqService.close();
      await dataSource.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close();
      await rabbitMqService.close();
      await dataSource.destroy();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
