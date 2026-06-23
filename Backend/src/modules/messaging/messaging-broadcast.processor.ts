import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { NotificationsService } from '@/modules/notifications/notifications.service';

export const MESSAGING_BROADCAST_QUEUE = 'messaging-broadcast';

export type MessagingBroadcastJob = {
  subject: string;
  content: string;
  recipients: { email: string; patientId: string }[];
};

@Processor(MESSAGING_BROADCAST_QUEUE)
export class MessagingBroadcastProcessor extends WorkerHost {
  private readonly log = new Logger(MessagingBroadcastProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<MessagingBroadcastJob>): Promise<void> {
    const { subject, content, recipients } = job.data;
    for (const r of recipients) {
      await this.notifications.sendAppointmentEvent({
        kind: 'booked',
        toEmail: r.email,
        subject: `[OphthoCare] ${subject}`,
        body: content,
        meta: { patientId: r.patientId, broadcast: 'true' },
      });
    }
    this.log.log(`Broadcast sent to ${recipients.length} recipients (job ${job.id})`);
  }
}
