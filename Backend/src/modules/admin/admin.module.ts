import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SpecialtiesModule } from '@/modules/specialties/specialties.module';
import { DOCUMENT_PDF_QUEUE } from '@/modules/documents/documents-pdf.processor';
import { MESSAGING_BROADCAST_QUEUE } from '@/modules/messaging/messaging-broadcast.processor';
import { APPOINTMENT_REMINDERS_QUEUE } from '@/modules/appointments/appointment-reminders.processor';

@Module({
  imports: [
    SpecialtiesModule,
    BullModule.registerQueue(
      { name: DOCUMENT_PDF_QUEUE },
      { name: MESSAGING_BROADCAST_QUEUE },
      { name: APPOINTMENT_REMINDERS_QUEUE },
    ),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
