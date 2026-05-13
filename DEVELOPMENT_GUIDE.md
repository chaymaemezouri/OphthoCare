# 🔨 GUIDE CODE PAR CODE - DÉMARRAGE IMMÉDIAT

## 🎯 Objectif
Ce guide vous indique **exactement dans quel ordre** développer le code pour démarrer le projet proprement, en commençant par les fondations.

---

## ⏱️ TIMING RECOMMANDÉ
- **Semaine 1-2**: Backend setup + Database
- **Semaine 2-3**: Frontend restructuration
- **Semaine 3-4**: Auth module
- **Semaine 4-6**: Modules utilisateurs + première intégration

---

## 🔴 PHASE 1 - SEMAINE 1 : INFRASTRUCTURE BACKEND

### 📋 ÉTAPE 1.1 : Initialiser Backend NestJS

**Commandes:**
```bash
# Dans le dossier OphthoCare
npm init -y
mkdir backend
cd backend
npm i -g @nestjs/cli
nest new . --package-manager npm --skip-git
```

**Répondre aux prompts:**
- Utiliser npm
- Sélectionner "strict": oui
- Sélectionner TypeScript: oui

**Résultat:**
```
backend/
├── src/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── node_modules/
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 📋 ÉTAPE 1.2 : Installer Dépendances Core

```bash
cd backend

# Dépendances principales
npm install @nestjs/common @nestjs/core @nestjs/platform-express \
  @nestjs/config @nestjs/jwt @nestjs/passport \
  @nestjs/typeorm typeorm pg \
  @nestjs/redis redis \
  passport passport-jwt passport-local \
  bcrypt class-validator class-transformer \
  joi axios dotenv winston

# DevDependencies
npm install -D @types/bcrypt @types/node @types/express \
  @nestjs/cli @nestjs/testing jest ts-jest ts-loader \
  eslint prettier @typescript-eslint/eslint-plugin
```

### 📋 ÉTAPE 1.3 : Créer .env.example

**Fichier: `backend/.env.example`**
```env
# APP
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# DATABASE
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ophthoccare
DATABASE_PASSWORD=secure_password_123
DATABASE_NAME=ophthoccare_db

# REDIS
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars

# AI / OpenAI (Phase 4)
OPENAI_API_KEY=

# STORAGE (S3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1
AWS_S3_BUCKET=ophthoccare-files
```

**Copier en `.env`:**
```bash
cp backend/.env.example backend/.env
# Puis éditer les valeurs
```

### 📋 ÉTAPE 1.4 : Configurer Docker Compose

**Fichier: `backend/docker-compose.yml`**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ophthoccare_postgres
    environment:
      POSTGRES_USER: ophthoccare
      POSTGRES_PASSWORD: secure_password_123
      POSTGRES_DB: ophthoccare_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ophthoccare

  redis:
    image: redis:7-alpine
    container_name: ophthoccare_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ophthoccare

  adminer:
    image: adminer:latest
    container_name: ophthoccare_adminer
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - ophthoccare

volumes:
  postgres_data:
  redis_data:

networks:
  ophthoccare:
    driver: bridge
```

**Lancer les services:**
```bash
docker-compose up -d

# Vérifier
docker-compose ps
# Adminer: http://localhost:8080 (connexion avec ophthoccare/password)
```

### 📋 ÉTAPE 1.5 : Setup TypeORM Configuration

**Fichier: `backend/src/config/database.config.ts`**
```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'ophthoccare',
  password: process.env.DATABASE_PASSWORD || 'secure_password_123',
  database: process.env.DATABASE_NAME || 'ophthoccare_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/{*.ts,.js}'],
  subscribers: [__dirname + '/../**/*.subscriber{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development', // DANGER en prod!
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
});
```

### 📋 ÉTAPE 1.6 : Configurer App Module

**Fichier: `backend/src/app.module.ts`** (refactoriser)
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### 📋 ÉTAPE 1.7 : Démarrer le serveur

```bash
npm run start:dev
```

**Sortie attendue:**
```
[Nest] 12345  - 01/01/2025, 10:00:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/01/2025, 10:00:00     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/01/2025, 10:00:00     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 01/01/2025, 10:00:00     LOG Listen on port 3001
```

---

## 🟡 PHASE 1 - SEMAINE 2 : DATABASE & ENTITIES

### 📋 ÉTAPE 2.1 : Créer les Entités Principales

**Créer dossier:**
```bash
mkdir -p backend/src/common/entities
```

**Fichier: `backend/src/common/entities/base.entity.ts`** (entité de base)
```typescript
import { CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

**Fichier: `backend/src/modules/users/entities/user.entity.ts`**
```typescript
import { Entity, Column, Index, BeforeInsert } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  SECRETARY = 'secretary',
  TRAINEE = 'trainee',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}
```

**Fichier: `backend/src/modules/doctors/entities/doctor.entity.ts`**
```typescript
import { Entity, Column, OneToOne, JoinColumn, ManyToMany, JoinTable, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('doctors')
@Index(['specialtyCode', 'city'], { unique: false })
export class Doctor extends BaseEntity {
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  specialtyCode: string; // 'ophthalmology', 'cardiology', etc.

  @Column({ type: 'simple-array', nullable: true })
  subSpecialties?: string[];

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column()
  city: string;

  @Column()
  street: string;

  @Column()
  postalCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  consultationPrice: number;

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, any>; // { "monday": { "start": "09:00", "end": "18:00" } }

  @Column({ default: false })
  isVerified: boolean;
}
```

**Fichier: `backend/src/modules/patients/entities/patient.entity.ts`**
```typescript
import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('patients')
export class Patient extends BaseEntity {
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string; // 'male', 'female', 'other'

  @Column({ nullable: true })
  nationalId: string;

  @Column({ type: 'jsonb', nullable: true })
  medicalData: {
    allergies?: string[];
    bloodGroup?: string;
    chronicDiseases?: string[];
    medications?: Array<{ name: string; dosage: string; duration: string }>;
  };

  @Column({ nullable: true })
  insuranceProvider: string;

  @Column({ nullable: true })
  insuranceNumber: string;

  @Column({ type: 'jsonb', nullable: true })
  familyMembers?: Array<{
    name: string;
    relationship: string;
    dateOfBirth: string;
  }>;
}
```

**Fichier: `backend/src/modules/appointments/entities/appointment.entity.ts`**
```typescript
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Doctor } from '@/modules/doctors/entities/doctor.entity';
import { Patient } from '@/modules/patients/entities/patient.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
@Index(['doctor', 'startTime'], { unique: false })
@Index(['patient', 'startTime'], { unique: false })
export class Appointment extends BaseEntity {
  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn()
  doctor: Doctor;

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn()
  patient: Patient;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'enum', enum: ['in-person', 'video'], default: 'in-person' })
  type: 'in-person' | 'video';

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;
}
```

**Fichier: `backend/src/modules/consultations/entities/consultation.entity.ts`**
```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Doctor } from '@/modules/doctors/entities/doctor.entity';
import { Patient } from '@/modules/patients/entities/patient.entity';
import { Appointment } from '@/modules/appointments/entities/appointment.entity';

@Entity('consultations')
export class Consultation extends BaseEntity {
  @ManyToOne(() => Doctor)
  @JoinColumn()
  doctor: Doctor;

  @ManyToOne(() => Patient)
  @JoinColumn()
  patient: Patient;

  @ManyToOne(() => Appointment)
  @JoinColumn()
  appointment: Appointment;

  @Column()
  consultationDate: Date;

  @Column({ nullable: true })
  symptoms: string;

  @Column({ nullable: true })
  diagnosis: string; // CIM-10 code

  @Column({ type: 'jsonb', nullable: true })
  clinicalData: Record<string, any>; // Par spécialité

  @Column({ nullable: true })
  treatment: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  duration: number; // en minutes

  @Column({ default: false })
  isCompleted: boolean;
}
```

### 📋 ÉTAPE 2.2 : Créer Modules Principaux

```bash
# Générer modules avec NestJS CLI
nest g module modules/users
nest g service modules/users
nest g controller modules/users
nest g module modules/doctors
nest g service modules/doctors
nest g controller modules/doctors
nest g module modules/patients
nest g service modules/patients
nest g controller modules/patients
```

**Structure créée:**
```
backend/src/modules/
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
├── doctors/
│   ├── doctors.module.ts
│   ├── doctors.service.ts
│   ├── doctors.controller.ts
│   ├── entities/
│   │   └── doctor.entity.ts
│   └── dto/
└── patients/
    ├── patients.module.ts
    ├── patients.service.ts
    ├── patients.controller.ts
    ├── entities/
    │   └── patient.entity.ts
    └── dto/
```

### 📋 ÉTAPE 2.3 : Implémenter Users Service

**Fichier: `backend/src/modules/users/users.service.ts`**
```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(skip = 0, take = 10): Promise<[User[], number]> {
    return this.usersRepository.findAndCount({
      skip,
      take,
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
```

**Fichier: `backend/src/modules/users/dto/create-user.dto.ts`**
```typescript
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsPhoneNumber('ZZ') // Accepts all formats
  phoneNumber?: string;
}
```

### 📋 ÉTAPE 2.4 : Intégrer Entities dans AppModule

**Fichier: `backend/src/app.module.ts`** (mettre à jour)
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    ConsultationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### 📋 ÉTAPE 2.5 : Migration & Seed

**Générer migration:**
```bash
npm run typeorm migration:generate src/database/migrations/initial-schema
npm run typeorm migration:run
```

**Créer fichier seed: `backend/src/database/seeds/specialties.seed.ts`**
```typescript
import { Specialty } from '@/modules/specialties/entities/specialty.entity';

export const SPECIALTIES_SEED = [
  { code: 'ophthalmology', name: 'Ophtalmologie', icon: 'eye' },
  { code: 'cardiology', name: 'Cardiologie', icon: 'heart' },
  { code: 'dermatology', name: 'Dermatologie', icon: 'skin' },
  { code: 'gynecology', name: 'Gynécologie', icon: 'uterus' },
  { code: 'pediatrics', name: 'Pédiatrie', icon: 'baby' },
  { code: 'neurology', name: 'Neurologie', icon: 'brain' },
  // ... ajouter les 18+ spécialités
];
```

---

## 🟢 PHASE 1 - SEMAINE 3 : AUTH MODULE

### 📋 ÉTAPE 3.1 : Créer Auth Module

```bash
nest g module modules/auth
nest g service modules/auth
nest g controller modules/auth
```

**Fichier: `backend/src/modules/auth/auth.service.ts`**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateUser(id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersService.findById(payload.sub);
      const access_token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { access_token };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

**Fichier: `backend/src/modules/auth/auth.controller.ts`**
```typescript
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
```

**Fichier: `backend/src/modules/auth/dto/login.dto.ts`**
```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### 📋 ÉTAPE 3.2 : Setup JWT Guard

**Fichier: `backend/src/modules/auth/guards/jwt.guard.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Fichier: `backend/src/modules/auth/guards/role.guard.ts`**
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@/modules/users/entities/user.entity';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

**Fichier: `backend/src/modules/auth/strategies/jwt.strategy.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return this.authService.validateUser(payload.sub);
  }
}
```

### 📋 ÉTAPE 3.3 : Setup Auth Module

**Fichier: `backend/src/modules/auth/auth.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRY || '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 🔵 SEMAINE 4-6 : FRONTEND RESTRUCTURATION

### 📋 ÉTAPE 4.1 : Refactoriser Structure Next.js

Suivre la structure du `PROJECT_STRUCTURE.md` avec les répertoires:

```bash
# Frontend - créer la structure complète
cd frontend/src

# Routes publiques
mkdir -p app/\(public\)/search app/\(public\)/doctor app/\(public\)/login
mkdir -p app/\(dashboard\)/patient app/\(dashboard\)/doctor

# Composants
mkdir -p components/{search,appointments,medical,ai,telemedicine,documents,analytics}
mkdir -p hooks lib/{api,utils,constants,services,validators} store types
```

### 📋 ÉTAPE 4.2 : Créer Service API

**Fichier: `frontend/src/lib/api/client.ts`**
```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

### 📋 ÉTAPE 4.3 : Configurer NextAuth

**Fichier: `frontend/src/lib/auth.ts`**
```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import apiClient from './api/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const response = await apiClient.post('/auth/login', {
            email: credentials?.email,
            password: credentials?.password,
          });

          if (response.data?.access_token) {
            return {
              id: response.data.user.id,
              email: response.data.user.email,
              role: response.data.user.role,
              accessToken: response.data.access_token,
              refreshToken: response.data.refresh_token,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
```

---

## ✅ Résumé Commandes Rapides

```bash
# Phase 1 - Semaine 1
cd backend && npm install
docker-compose up -d
npm run start:dev

# Phase 1 - Semaine 2-3
npm run typeorm migration:run
# ... développer entités et services

# Phase 1 - Semaine 4-6
# Frontend refactoring

# TEST BACKEND
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","role":"patient"}'

curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

---

## 🎯 CHECKPOINTS - Phase 1 Complète

- ✅ Backend lancé sur port 3001
- ✅ PostgreSQL + Redis en Docker
- ✅ Entities créées (User, Doctor, Patient, Appointment, Consultation)
- ✅ Auth API fonctionnelle (register, login, refresh)
- ✅ JWT guards en place
- ✅ Frontend structure reorganisée
- ✅ NextAuth configuré
- ✅ API client ready
- ✅ Database migrations runnable
- ✅ .env files créés

