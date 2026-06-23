import { Module } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';
import { SpecialtiesController } from './specialties.controller';
import { RoleGuard } from '@/modules/auth/guards/role.guard';

@Module({
  providers: [SpecialtiesService, RoleGuard],
  controllers: [SpecialtiesController],
  exports: [SpecialtiesService],
})
export class SpecialtiesModule {}