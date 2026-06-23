import { Module } from '@nestjs/common';
import { TeleconsultService } from './teleconsult.service';
import { TeleconsultController } from './teleconsult.controller';
import { AppointmentsModule } from '@/modules/appointments/appointments.module';
import { PatientsModule } from '@/modules/patients/patients.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { RoleGuard } from '@/modules/auth/guards/role.guard';

@Module({
  imports: [AppointmentsModule, PatientsModule, DoctorsModule],
  controllers: [TeleconsultController],
  providers: [TeleconsultService, RoleGuard],
  exports: [TeleconsultService],
})
export class TeleconsultModule {}
