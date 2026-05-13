import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '@/config/database.config';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DoctorsModule } from '@/modules/doctors/doctors.module';
import { PatientsModule } from '@/modules/patients/patients.module';
import { SpecialtiesModule } from '@/modules/specialties/specialties.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    UsersModule,
    AuthModule,
    DoctorsModule,
    PatientsModule,
    SpecialtiesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
