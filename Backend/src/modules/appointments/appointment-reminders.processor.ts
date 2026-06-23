import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';

export const APPOINTMENT_REMINDERS_QUEUE = 'appointment-reminders';

export type AppointmentReminderJob = {
  appointmentId: string;
  phase: 'day_before' | 'two_hours';
};

@Processor(APPOINTMENT_REMINDERS_QUEUE)
export class AppointmentRemindersProcessor extends WorkerHost {
  private readonly log = new Logger(AppointmentRemindersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<AppointmentReminderJob>): Promise<void> {
    const { appointmentId, phase } = job.data;
    const row = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        deletedAt: null,
        status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed, AppointmentStatus.in_progress] },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });
    if (!row?.patient.user || !row.doctor.user) return;

    const when = row.startTime.toISOString();
    const patientEmail = row.patient.user.email;
    const patientPhone = row.patient.user.phoneNumber ?? undefined;
    const doctorEmail = row.doctor.user.email;
    const doctorPhone = row.doctor.user.phoneNumber ?? undefined;

    if (phase === 'day_before') {
      if (row.reminderDayBeforeSent) return;
      await this.notifications.sendAppointmentEvent({
        kind: 'reminder',
        toEmail: patientEmail,
        toPhone: patientPhone,
        smsBody: `Rappel J-1 : RDV le ${when}.`,
        subject: 'Rappel : rendez-vous demain',
        body: `Bonjour, rappel : vous avez un rendez-vous le ${when}.`,
        meta: { appointmentId, phase: 'day_before' },
      });
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { reminderDayBeforeSent: true },
      });
      this.log.log(`J-1 reminder queued/sent for ${appointmentId}`);
      return;
    }

    if (phase === 'two_hours') {
      if (row.reminderTwoHourSent) return;
      await this.notifications.sendAppointmentEvent({
        kind: 'reminder',
        toEmail: patientEmail,
        toPhone: patientPhone,
        smsBody: `Rappel H-2 : RDV à ${when}.`,
        subject: 'Rappel : rendez-vous dans 2 heures',
        body: `Bonjour, votre rendez-vous a lieu vers ${when}.`,
        meta: { appointmentId, phase: 'two_hours' },
      });
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { reminderTwoHourSent: true },
      });
      this.log.log(`H-2 SMS/email for ${appointmentId}`);
    }
  }
}
