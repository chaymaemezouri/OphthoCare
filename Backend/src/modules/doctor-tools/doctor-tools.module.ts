import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '@/modules/patients/patients.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { DoctorToolsController } from './doctor-tools.controller';
import { DoctorToolsService } from './doctor-tools.service';
import { DoctorToolsImagesService } from './doctor-tools-images.service';
import { DoctorToolsContextService } from './doctor-tools-context.service';
import { WebhooksDispatchService } from './webhooks-dispatch.service';
import { RoleGuard } from '@/modules/auth/guards/role.guard';

@Module({
  imports: [forwardRef(() => PatientsModule), DoctorsModule],
  controllers: [DoctorToolsController],
  providers: [
    DoctorToolsService,
    DoctorToolsImagesService,
    DoctorToolsContextService,
    WebhooksDispatchService,
    RoleGuard,
  ],
  exports: [WebhooksDispatchService, DoctorToolsService, DoctorToolsContextService],
})
export class DoctorToolsModule {}
