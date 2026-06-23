import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { SanitizedUser } from '@/modules/users/users.service';
import { MedicalRecordsService } from './medical-records.service';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';
import { ImportDossierDto } from './dto/import-dossier.dto';

@ApiTags('Medical records')
@Controller('clinical-records')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('for-patient/:patientId')
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient)
  listForPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @ReqUser() user: SanitizedUser,
  ) {
    return this.medicalRecordsService.listForPatient(user, patientId);
  }

  @Get('templates/:specialtyCode')
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient)
  getTemplate(@Param('specialtyCode') specialtyCode: string) {
    return this.medicalRecordsService.getFieldTemplate(specialtyCode);
  }

  /** Entrées cliniques rédigées par le médecin connecté (tous patients confondus). */
  @Get('mine')
  @Roles(UserRole.doctor)
  listMine(
    @ReqUser() user: SanitizedUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('q') q?: string,
  ) {
    return this.medicalRecordsService.listAuthoredByDoctor(user, {
      skip: skip != null && skip !== '' ? parseInt(skip, 10) || 0 : 0,
      take: take != null && take !== '' ? parseInt(take, 10) || 20 : 20,
      q: q?.trim(),
    });
  }

  @Post('import/:patientId')
  @Roles(UserRole.admin, UserRole.doctor)
  importDossier(
    @ReqUser() user: SanitizedUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: ImportDossierDto,
  ) {
    return this.medicalRecordsService.importDossier(user, patientId, dto);
  }

  @Post()
  @Roles(UserRole.admin, UserRole.doctor)
  create(@ReqUser() user: SanitizedUser, @Body() dto: CreateClinicalRecordDto) {
    return this.medicalRecordsService.create(user, dto);
  }

  @Get(':id/versions')
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient)
  versions(@ReqUser() user: SanitizedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordsService.listVersions(user, id);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient)
  getOne(@ReqUser() user: SanitizedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordsService.getOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.doctor)
  update(
    @ReqUser() user: SanitizedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicalRecordDto,
  ) {
    return this.medicalRecordsService.update(user, id, dto);
  }
}
