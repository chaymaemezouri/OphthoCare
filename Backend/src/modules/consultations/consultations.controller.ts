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
import type { RequestUser } from '@/modules/auth/auth.types';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { ImportPreConsultationDto } from './dto/import-pre-consultation.dto';

@ApiTags('Consultations')
@Controller('consultations')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get('compare')
  @Roles(UserRole.doctor)
  compare(
    @ReqUser() user: RequestUser,
    @Query('id1', ParseUUIDPipe) id1: string,
    @Query('id2', ParseUUIDPipe) id2: string,
  ) {
    return this.consultationsService.compare(user, id1, id2);
  }

  @Get('vitals-timeline')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient, UserRole.admin)
  vitalsTimeline(
    @ReqUser() user: RequestUser,
    @Query('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.consultationsService.vitalsTimeline(user, patientId);
  }

  @Get('patient/mine')
  @Roles(UserRole.patient)
  listMineForPatient(
    @ReqUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.consultationsService.listMineForPatient(user, { status, from, to });
  }

  @Post()
  @Roles(UserRole.doctor)
  create(@ReqUser() user: RequestUser, @Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(user, dto);
  }

  @Get('by-patient/:patientId')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.admin)
  listForPatient(
    @ReqUser() user: RequestUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.consultationsService.listForStaffByPatient(user, patientId);
  }

  @Get('mine/prescriptions')
  @Roles(UserRole.doctor, UserRole.admin)
  listMinePrescriptions(
    @ReqUser() user: RequestUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('q') q?: string,
  ) {
    return this.consultationsService.listMinePrescriptions(user, {
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
      q,
    });
  }

  @Post(':id/share-prescription')
  @Roles(UserRole.doctor, UserRole.admin)
  sharePrescription(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.sharePrescriptionWithPatient(user, id);
  }

  @Get(':id')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.trainee, UserRole.patient, UserRole.admin)
  findOne(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.doctor)
  update(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.consultationsService.update(user, id, dto);
  }

  @Post(':id/start')
  @Roles(UserRole.doctor)
  start(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.start(user, id);
  }

  @Post(':id/close')
  @Roles(UserRole.doctor)
  close(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.close(user, id);
  }

  @Post(':id/import-pre-consultation')
  @Roles(UserRole.doctor)
  importPre(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ImportPreConsultationDto,
  ) {
    return this.consultationsService.importPreConsultation(user, id, dto.preFormId);
  }
}
