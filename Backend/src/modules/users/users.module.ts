import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PatientsModule } from '@/modules/patients/patients.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { RoleGuard } from '@/modules/auth/guards/role.guard';

@Module({
  imports: [PatientsModule, forwardRef(() => AuthModule), DoctorsModule],
  providers: [UsersService, RoleGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
