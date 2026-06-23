import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { DoctorToolsModule } from '@/modules/doctor-tools/doctor-tools.module';
import { PatientsModule } from '@/modules/patients/patients.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { BullModule } from '@nestjs/bullmq';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import {
  MESSAGING_BROADCAST_QUEUE,
  MessagingBroadcastProcessor,
} from './messaging-broadcast.processor';
import { MessagingBroadcastQueue } from './messaging-broadcast.queue';

@Module({
  imports: [
    AuthModule,
    DoctorToolsModule,
    PatientsModule,
    NotificationsModule,
    BullModule.registerQueue({ name: MESSAGING_BROADCAST_QUEUE }),
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    MessagingGateway,
    MessagingBroadcastProcessor,
    MessagingBroadcastQueue,
    RoleGuard,
  ],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
