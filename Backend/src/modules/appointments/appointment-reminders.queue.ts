import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  APPOINTMENT_REMINDERS_QUEUE,
  type AppointmentReminderJob,
} from './appointment-reminders.processor';

@Injectable()
export class AppointmentRemindersQueue {
  private readonly log = new Logger(AppointmentRemindersQueue.name);

  constructor(@InjectQueue(APPOINTMENT_REMINDERS_QUEUE) private readonly queue: Queue) {}

  async scheduleForAppointment(appointmentId: string, startTime: Date): Promise<void> {
    const now = Date.now();
    const startMs = startTime.getTime();
    const dayBeforeAt = startMs - 24 * 60 * 60 * 1000;
    const twoHoursAt = startMs - 2 * 60 * 60 * 1000;

    const jobs: Array<{ delay: number; data: AppointmentReminderJob; jobId: string }> = [];
    const d1 = dayBeforeAt - now;
    if (d1 > 30_000) {
      jobs.push({
        delay: d1,
        data: { appointmentId, phase: 'day_before' },
        jobId: `${appointmentId}-day_before`,
      });
    }
    const h2 = twoHoursAt - now;
    if (h2 > 30_000) {
      jobs.push({
        delay: h2,
        data: { appointmentId, phase: 'two_hours' },
        jobId: `${appointmentId}-two_hours`,
      });
    }

    for (const j of jobs) {
      try {
        await this.queue.add('remind', j.data, {
          delay: j.delay,
          jobId: j.jobId,
          removeOnComplete: true,
          attempts: 2,
        });
      } catch (e) {
        this.log.warn(`Could not enqueue reminder ${j.jobId}: ${(e as Error).message}`);
      }
    }
  }

  async cancelScheduled(appointmentId: string): Promise<void> {
    for (const suffix of ['day_before', 'two_hours']) {
      try {
        const job = await this.queue.getJob(`${appointmentId}-${suffix}`);
        await job?.remove();
      } catch {
        /* ignore */
      }
    }
  }
}
