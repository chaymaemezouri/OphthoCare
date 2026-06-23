import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '@/modules/patients/patients.module';
import { DoctorToolsModule } from '@/modules/doctor-tools/doctor-tools.module';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';

@Module({
  imports: [PatientsModule, forwardRef(() => DoctorToolsModule)],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, RoleGuard],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
