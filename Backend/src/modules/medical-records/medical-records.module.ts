import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { PatientsModule } from '@/modules/patients/patients.module';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';

@Module({
  imports: [PrismaModule, PatientsModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, RoleGuard],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
