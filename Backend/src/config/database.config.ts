import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Doctor } from '@/modules/doctors/entities/doctor.entity';
import { Patient } from '@/modules/patients/entities/patient.entity';
import { Specialty } from '@/modules/specialties/entities/specialty.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'ophthoccare',
  password: process.env.DATABASE_PASSWORD || 'secure_password_123',
  database: process.env.DATABASE_NAME || 'ophthoccare_db',
  entities: [User, Doctor, Patient, Specialty],
  migrations: [__dirname + '/../database/migrations/{*.ts,.js}'],
  subscribers: [],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
  ssl: process.env.NODE_ENV === 'production' ? true : false,
});
