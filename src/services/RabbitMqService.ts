import amqp from 'amqplib';
import { MissionCompletedEvent } from '../dtos/MissionCompletedEvent';
import { InfrastructureException } from '../exceptions/InfrastructureException';
import { QueueConfig } from '../config/app.config';

export class RabbitMqService {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName: string;
  private readonly rabbitmqUrl: string;

  constructor() {
    this.rabbitmqUrl = QueueConfig.url;
    this.queueName = QueueConfig.missionQueue;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      console.log('Connected to RabbitMQ');
    } catch (error) {
      throw new InfrastructureException('Failed to connect to RabbitMQ', error as Error);
    }
  }

  async publishMissionCompletedEvent(event: MissionCompletedEvent): Promise<void> {
    if (!this.channel) {
      throw new InfrastructureException('RabbitMQ channel not initialized');
    }

    try {
      const message = JSON.stringify(event);
      this.channel.sendToQueue(this.queueName, Buffer.from(message), {
        persistent: true,
      });
      console.log(`Published mission completed event for student ${event.student_id}`);
    } catch (error) {
      throw new InfrastructureException('Failed to publish event to RabbitMQ', error as Error);
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log('Closed RabbitMQ connection');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}
