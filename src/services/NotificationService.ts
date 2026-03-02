import { N8nPayloadDto } from '../dtos/N8nPayloadDto';
import { InfrastructureException } from '../exceptions/InfrastructureException';

export class NotificationService {
  private readonly n8nWebhookUrl: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelayMs: number = 1000;

  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || '';
    
    if (!this.n8nWebhookUrl) {
      console.warn('N8N_WEBHOOK_URL not configured. Webhook notifications will be skipped.');
    }
  }

  /**
   * Send mission completion event to n8n webhook with retry logic
   */
  async sendMissionCompletedEvent(payload: N8nPayloadDto): Promise<void> {
    if (!this.n8nWebhookUrl) {
      console.log('Skipping n8n notification (webhook URL not configured)');
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`n8n webhook returned status ${response.status}`);
        }

        console.log(`Successfully sent event to n8n for student ${payload.student_id}`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`n8n webhook attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          await this.sleep(delay);
        }
      }
    }

    throw new InfrastructureException(
      `Failed to send event to n8n after ${this.maxRetries} attempts`,
      lastError || undefined
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
