import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { DataSource } from 'typeorm';
import { MissionCompletedEvent } from '../dtos/MissionCompletedEvent';
import { NotificationService } from '../services/NotificationService';
import { N8nPayloadDto } from '../dtos/N8nPayloadDto';

export class MissionProcessorWorker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly queueName = 'mission_completed';
  private readonly rabbitmqUrl: string;
  private notificationService: NotificationService;

  constructor(private dataSource: DataSource) {
    this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.notificationService = new NotificationService();
  }

  async start(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      
      console.log('Mission Processor Worker started. Waiting for messages...');

      this.channel.consume(this.queueName, async (msg: ConsumeMessage | null) => {
        if (msg) {
          await this.processMessage(msg);
        }
      });
    } catch (error) {
      console.error('Failed to start worker:', error);
      throw error;
    }
  }

  private async processMessage(msg: ConsumeMessage): Promise<void> {
    try {
      const event: MissionCompletedEvent = JSON.parse(msg.content.toString());
      console.log(`Processing mission completed event for student ${event.student_id}`);

      // Transform to n8n payload
      const n8nPayload: N8nPayloadDto = {
        student_id: event.student_id,
        student_name: event.student_name,
        parent_email: event.parent_email,
        mission_id: event.mission_id,
        mission_title: event.mission_title,
        score: event.score,
        time_taken: event.time_taken,
        hints_used: event.hints_used,
        logic_score: event.updated_metrics.logic_score,
        ethics_score: event.updated_metrics.ethics_score,
        ai_orchestration_score: event.updated_metrics.ai_orchestration_score,
        completed_at: event.completed_at,
      };

      // Send to n8n webhook
      await this.notificationService.sendMissionCompletedEvent(n8nPayload);

      // Acknowledge message
      this.channel?.ack(msg);
      console.log(`Successfully processed event for student ${event.student_id}`);
    } catch (error) {
      console.error('Error processing message:', error);
      // Reject and requeue the message
      this.channel?.nack(msg, false, true);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log('Worker stopped');
    } catch (error) {
      console.error('Error stopping worker:', error);
    }
  }
}
