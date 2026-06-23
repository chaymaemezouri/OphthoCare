import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsDocumentsService } from './prescriptions-documents.service';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsDocumentsService) {}

  @Post()
  @Roles(UserRole.doctor)
  create(@ReqUser() user: RequestUser, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptions.create(user, dto);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.doctor, UserRole.patient)
  listPatient(@ReqUser() user: RequestUser, @Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.prescriptions.listForPatient(user, patientId);
  }

  @Get(':id')
  @Roles(UserRole.doctor, UserRole.patient)
  get(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptions.getById(user, id);
  }

  @Post(':id/send')
  @Roles(UserRole.doctor, UserRole.secretary)
  send(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptions.sendToPatient(user, id);
  }
}
