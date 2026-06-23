import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
import { UserRole, AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentDoctorDto } from './dto/create-appointment-doctor.dto';
import { UpdateAppointmentDoctorDto } from './dto/update-appointment-doctor.dto';
import { MergeAppointmentsDto } from './dto/merge-appointments.dto';
import { SplitAppointmentDto } from './dto/split-appointment.dto';
import { QueryAppointmentSlotsDto } from './dto/query-appointment-slots.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { PatientPreConsultationDto } from './dto/patient-pre-consultation.dto';
import { ReschedulePatientAppointmentDto } from './dto/reschedule-patient-appointment.dto';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { SanitizedUser } from '@/modules/users/users.service';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('slots')
  getSlots(@Query() query: QueryAppointmentSlotsDto) {
    return this.appointmentsService.getPublicSlots(query);
  }

  @Get('patient/me')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  listPatientMe(@ReqUser() user: SanitizedUser) {
    return this.appointmentsService.listMine(user);
  }

  @Get('patient/:appointmentId/pre-consultation')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  getPatientPreConsultation(
    @ReqUser() user: SanitizedUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentsService.getPatientPreConsultation(user, appointmentId);
  }

  @Put('patient/:appointmentId/pre-consultation')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  putPatientPreConsultation(
    @ReqUser() user: SanitizedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: PatientPreConsultationDto,
  ) {
    return this.appointmentsService.putPatientPreConsultation(user, appointmentId, dto);
  }

  @Put('patient/:appointmentId/reschedule')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  rescheduleForPatient(
    @ReqUser() user: SanitizedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: ReschedulePatientAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleForPatient(user, appointmentId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  listMine(@ReqUser() user: SanitizedUser) {
    return this.appointmentsService.listMine(user);
  }

  @Get('doctor/:doctorId/today')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  listDoctorToday(
    @ReqUser() user: SanitizedUser,
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    if (!date?.trim()) throw new BadRequestException('Query date (YYYY-MM-DD) requis');
    return this.appointmentsService.listDoctorDay(user, doctorId, date.trim());
  }

  @Get('doctor/:doctorId/week')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  listDoctorWeek(
    @ReqUser() user: SanitizedUser,
    @Param('doctorId') doctorId: string,
    @Query('weekStart') weekStart: string,
  ) {
    if (!weekStart?.trim()) throw new BadRequestException('Query weekStart (YYYY-MM-DD) requis');
    return this.appointmentsService.listDoctorWeek(user, doctorId, weekStart.trim());
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient, UserRole.doctor, UserRole.secretary, UserRole.admin)
  @ApiBearerAuth()
  list(
    @ReqUser() user: SanitizedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    let st: AppointmentStatus | undefined;
    if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      st = status as AppointmentStatus;
    }
    return this.appointmentsService.listForUser(user, { from, to, status: st });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient, UserRole.doctor, UserRole.secretary, UserRole.admin)
  @ApiBearerAuth()
  getOne(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.findOneForUser(user, id);
  }

  @Post('doctor/merge')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  mergeDoctor(@ReqUser() user: SanitizedUser, @Body() dto: MergeAppointmentsDto) {
    return this.appointmentsService.mergeByDoctor(user, dto);
  }

  @Post('doctor/:id/split')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  splitDoctor(
    @ReqUser() user: SanitizedUser,
    @Param('id') id: string,
    @Body() dto: SplitAppointmentDto,
  ) {
    return this.appointmentsService.splitByDoctor(user, id, dto);
  }

  @Post('doctor/:id/remind')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  remindDoctor(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.sendReminder(user, id);
  }

  @Patch('doctor/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  patchDoctor(
    @ReqUser() user: SanitizedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDoctorDto,
  ) {
    return this.appointmentsService.updateByDoctor(user, id, dto);
  }

  @Post('doctor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  createDoctor(@ReqUser() user: SanitizedUser, @Body() dto: CreateAppointmentDoctorDto) {
    return this.appointmentsService.createByDoctor(user, dto);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  confirm(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.confirmByStaff(user, id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient, UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  cancel(
    @ReqUser() user: SanitizedUser,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancelAppointment(user, id, dto);
  }

  @Patch(':id/no-show')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  noShow(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.markNoShow(user, id);
  }

  @Patch(':id/check-in')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.secretary)
  @ApiBearerAuth()
  checkIn(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.checkInBySecretary(user, id);
  }

  @Post('doctor/:id/send-pre-consultation-link')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  sendPreConsultationLink(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.sendPreConsultationLink(user, id);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  startConsult(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.startConsultation(user, id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  completeConsult(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.completeConsultation(user, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient, UserRole.secretary)
  @ApiBearerAuth()
  create(@ReqUser() user: SanitizedUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.createForPatient(user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.patient)
  @ApiBearerAuth()
  cancelLegacy(@ReqUser() user: SanitizedUser, @Param('id') id: string) {
    return this.appointmentsService.cancelMine(user, id);
  }
}
