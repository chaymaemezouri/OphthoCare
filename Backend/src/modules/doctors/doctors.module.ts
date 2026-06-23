import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorAnalyticsService } from './doctor-analytics.service';
import { DoctorBillingService } from './doctor-billing.service';
import { DoctorStaffService } from './doctor-staff.service';
import { DoctorsSpaceService } from './doctors-space.service';
import { DoctorsController } from './doctors.controller';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { DoctorSearchIndexService } from './doctor-search-index.service';
import { DoctorSearchReindexWire } from './doctor-search-reindex.wire';

@Module({
  providers: [
    DoctorsService,
    DoctorAnalyticsService,
    DoctorBillingService,
    DoctorStaffService,
    DoctorsSpaceService,
    DoctorSearchIndexService,
    RoleGuard,
    DoctorSearchReindexWire,
  ],
  controllers: [DoctorsController],
  exports: [DoctorsService, DoctorsSpaceService, DoctorSearchIndexService],
})
export class DoctorsModule {}
