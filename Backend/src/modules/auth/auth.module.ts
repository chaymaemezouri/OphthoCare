import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '@/modules/users/users.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { DoctorSpaceGuard } from '@/common/guards/doctor-space.guard';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => DoctorsModule),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [AuthService, JwtStrategy, DoctorSpaceGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule, DoctorSpaceGuard],
})
export class AuthModule {}
