import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { PatientNationalIdCryptoService } from '@/common/crypto/patient-national-id-crypto.service';

@Module({
  providers: [PatientsService, PatientNationalIdCryptoService, RoleGuard],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}
