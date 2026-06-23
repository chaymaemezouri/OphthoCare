import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PatientsModule } from '@/modules/patients/patients.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { PublicPreConsultModule } from '@/modules/public-pre-consult/public-pre-consult.module';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { SlotLockService } from './slot-lock.service';
import {
  APPOINTMENT_REMINDERS_QUEUE,
  AppointmentRemindersProcessor,
} from './appointment-reminders.processor';
import { AppointmentRemindersQueue } from './appointment-reminders.queue';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({ name: APPOINTMENT_REMINDERS_QUEUE }),
    PatientsModule,
    DoctorsModule,
    NotificationsModule,
    PublicPreConsultModule,
  ],
  providers: [
    AppointmentsService,
    RoleGuard,
    SlotLockService,
    AppointmentRemindersProcessor,
    AppointmentRemindersQueue,
  ],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
