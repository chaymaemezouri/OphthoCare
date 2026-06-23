import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AppointmentNotifyPayload = {
  kind: 'booked' | 'cancelled' | 'updated' | 'reminder';
  toEmail?: string;
  toPhone?: string;
  smsBody?: string;
  subject: string;
  body: string;
  meta?: Record<string, string>;
};

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Envoie une notification (email ou webhook). Sans SMTP ni webhook configuré,
   * journalise uniquement — suffisant pour le développement et les tests d’intégration.
   */
  async sendAppointmentEvent(payload: AppointmentNotifyPayload): Promise<{ sent: boolean; channel: string }> {
    const webhook = this.config.get<string>('NOTIFICATION_WEBHOOK_URL');
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return { sent: true, channel: 'webhook' };
      } catch (e) {
        this.log.warn(`Webhook notification failed: ${(e as Error).message}`);
      }
    }
    const emailLine = payload.toEmail ? ` → ${payload.toEmail}` : '';
    const smsLine = payload.toPhone && payload.smsBody ? ` [SMS ${payload.toPhone}] ${payload.smsBody}` : '';
    this.log.log(`[notification:${payload.kind}]${emailLine}${smsLine}: ${payload.subject}`);
    return { sent: false, channel: 'log' };
  }
}
