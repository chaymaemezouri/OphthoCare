import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/prisma/prisma.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { PatientsModule } from '@/modules/patients/patients.module';
import { SpecialtiesModule } from '@/modules/specialties/specialties.module';
import { AppointmentsModule } from '@/modules/appointments/appointments.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { MedicalRecordsModule } from '@/modules/medical-records/medical-records.module';
import { ConsultationsModule } from '@/modules/consultations/consultations.module';
import { TeleconsultModule } from '@/modules/teleconsult/teleconsult.module';
import { DoctorToolsModule } from '@/modules/doctor-tools/doctor-tools.module';
import { TraineeLearningModule } from '@/modules/trainee-learning/trainee-learning.module';
import { PublicPreConsultModule } from '@/modules/public-pre-consult/public-pre-consult.module';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { MessagingModule } from '@/modules/messaging/messaging.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuditLogModule } from '@/common/audit/audit-log.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', '127.0.0.1'),
          port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          maxRetriesPerRequest: null,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuditLogModule,
    UsersModule,
    AuthModule,
    DoctorsModule,
    PatientsModule,
    SpecialtiesModule,
    AppointmentsModule,
    NotificationsModule,
    MedicalRecordsModule,
    ConsultationsModule,
    TeleconsultModule,
    DoctorToolsModule,
    TraineeLearningModule,
    PublicPreConsultModule,
    DocumentsModule,
    MessagingModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
