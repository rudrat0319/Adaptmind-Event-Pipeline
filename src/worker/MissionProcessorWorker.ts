import amqp from 'amqplib';
import { DataSource } from 'typeorm';
import { MissionCompletedEvent } from '../dtos/MissionCompletedEvent';
import { NotificationService } from '../services/NotificationService';
import { N8nPayloadDto } from '../dtos/N8nPayloadDto';
import { QueueConfig } from '../config/app.config';

export class MissionProcessorWorker {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName: string;
  private readonly rabbitmqUrl: string;
  private notificationService: NotificationService;

  constructor(private dataSource: DataSource) {
    this.rabbitmqUrl = QueueConfig.url;
    this.queueName = QueueConfig.missionQueue;
    this.notificationService = new NotificationService();
  }

  async start(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      
      console.log('Mission Processor Worker started. Waiting for messages...');

      this.channel.consume(this.queueName, async (msg) => {
        if (msg) {
          await this.processMessage(msg);
        }
      });
    } catch (error) {
      console.error('Failed to start worker:', error);
      throw error;
    }
  }

  private async processMessage(msg: amqp.ConsumeMessage): Promise<void> {
    try {
      const event: MissionCompletedEvent = JSON.parse(msg.content.toString());
      console.log(`Processing mission completed event for student ${event.student_id}`);

      const n8nPayload: N8nPayloadDto = {
        student_id: event.student_id,
        student_name: event.student_name,
        parent_email: event.parent_email,
        mission_id: event.mission_id,
        mission_title: event.mission_title,
        score: event.score,
        time_taken: event.time_taken,
        energy_used: event.energy_used,
        decisions: event.decisions,
        sustainability_understanding: event.updated_metrics.sustainability_understanding,
        energy_efficiency_score: event.updated_metrics.energy_efficiency_score,
        decision_confidence: event.updated_metrics.decision_confidence,
        completed_at: event.completed_at,
      };

      await this.notificationService.sendMissionCompletedEvent(n8nPayload);

      this.channel?.ack(msg);
      console.log(`Successfully processed event for student ${event.student_id}`);
    } catch (error) {
      console.error('Error processing message:', error);
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
