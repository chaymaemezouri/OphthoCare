import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PatientsService } from './patients.service';
import { UpdatePatientMeDto } from './dto/update-patient-me.dto';
import { UpdatePatientDossierDto } from './dto/update-patient-dossier.dto';
import { PatientConsentDto } from './dto/patient-consent.dto';
import { AddPatientDiagnosisDto } from './dto/add-patient-diagnosis.dto';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('me/medical-records')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async myMedicalRecords(@ReqUser() user: RequestUser) {
    const patientId = await this.patientsService.findPatientIdForUser(user.id);
    return this.patientsService.getMedicalTimelineForPatient(user, patientId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async getMe(@ReqUser() user: RequestUser) {
    return this.patientsService.getMe(user.id);
  }

  @Get('me/receipts')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async myReceipts(@ReqUser() user: RequestUser) {
    return this.patientsService.listMyReceiptsForUser(user.id);
  }

  @Get('me/document-items')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async myDocumentItems(@ReqUser() user: RequestUser) {
    return this.patientsService.listMyDocumentItemsForUser(user.id);
  }

  @Get('me/notifications')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async myNotifications(@ReqUser() user: RequestUser) {
    return this.patientsService.listMyInAppNotifications(user.id);
  }

  @Patch('me/notifications/:notificationId/read')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async markNotificationRead(
    @ReqUser() user: RequestUser,
    @Param('notificationId') notificationId: string,
  ) {
    return this.patientsService.markMyNotificationRead(user.id, notificationId);
  }

  @Post('me/notifications/read-all')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async markAllNotificationsRead(@ReqUser() user: RequestUser) {
    return this.patientsService.markAllMyNotificationsRead(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async updateMe(@ReqUser() user: RequestUser, @Body() dto: UpdatePatientMeDto) {
    return this.patientsService.updateMe(user.id, dto);
  }

  @Get('lookup')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.admin)
  @ApiBearerAuth()
  async lookup(@ReqUser() user: RequestUser, @Query('q') q?: string, @Query('take') take?: string) {
    return this.patientsService.searchLightForStaff(
      user,
      q ?? '',
      take ? parseInt(take, 10) || 20 : 20,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee)
  @ApiBearerAuth()
  async list(
    @ReqUser() user: RequestUser,
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.patientsService.listForDoctorSpace(user, {
      q: q?.trim(),
      skip: skip != null && skip !== '' ? parseInt(skip, 10) || 0 : 0,
      take: take != null && take !== '' ? parseInt(take, 10) || 20 : 20,
    });
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient)
  @ApiBearerAuth()
  async history(@Param('id') id: string, @ReqUser() user: RequestUser) {
    return this.patientsService.getMedicalTimelineForPatient(user, id);
  }

  @Get(':id/medical-records')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient)
  @ApiBearerAuth()
  async medicalRecordsById(@Param('id') id: string, @ReqUser() user: RequestUser) {
    return this.patientsService.getMedicalTimelineForPatient(user, id);
  }

  @Post(':id/consent')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  async consent(
    @Param('id') id: string,
    @ReqUser() user: RequestUser,
    @Body() dto: PatientConsentDto,
  ) {
    const patientId = await this.patientsService.findPatientIdForUser(user.id);
    if (patientId !== id) {
      throw new BadRequestException('Identifiant patient invalide');
    }
    return this.patientsService.recordConsent(user.id, dto.type, dto.signedAt);
  }

  @Post(':id/diagnoses')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.admin)
  @ApiBearerAuth()
  async addDiagnosis(
    @Param('id') id: string,
    @ReqUser() user: RequestUser,
    @Body() dto: AddPatientDiagnosisDto,
  ) {
    return this.patientsService.addDiagnosisForDoctor(user, id, dto);
  }

  @Patch(':id/medical')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.admin)
  @ApiBearerAuth()
  async patchMedical(
    @Param('id') id: string,
    @ReqUser() user: RequestUser,
    @Body() dto: UpdatePatientDossierDto,
  ) {
    return this.patientsService.updateDossierByDoctor(user, id, dto);
  }

  @Patch(':id/dossier')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.doctor)
  @ApiBearerAuth()
  async patchDossier(
    @Param('id') id: string,
    @ReqUser() user: RequestUser,
    @Body() dto: UpdatePatientDossierDto,
  ) {
    return this.patientsService.updateDossierByDoctor(user, id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async patchStaff(@Param('id') id: string, @ReqUser() user: RequestUser, @Body() dto: UpdatePatientMeDto) {
    return this.patientsService.updatePatientByStaff(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.doctor)
  @ApiBearerAuth()
  async deleteStaff(@Param('id') id: string, @ReqUser() user: RequestUser) {
    return this.patientsService.softDeleteForStaff(user, id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin, UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient)
  @ApiBearerAuth()
  async getOne(@Param('id') id: string, @ReqUser() user: RequestUser) {
    return this.patientsService.findByIdForStaff(user, id);
  }
}
