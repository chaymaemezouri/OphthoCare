import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { CreateReportDocumentDto } from './dto/create-report-document.dto';
import { PatchReportDocumentDto } from './dto/patch-report-document.dto';
import { ReportsDocumentsService } from './reports-documents.service';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reports: ReportsDocumentsService) {}

  @Post()
  @Roles(UserRole.doctor)
  create(@ReqUser() user: RequestUser, @Body() dto: CreateReportDocumentDto) {
    return this.reports.create(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.doctor)
  patch(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchReportDocumentDto,
  ) {
    return this.reports.patch(user, id, dto);
  }

  @Get(':id')
  @Roles(UserRole.doctor, UserRole.patient)
  get(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.reports.getById(user, id);
  }

  @Post(':id/share')
  @Roles(UserRole.doctor)
  share(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.reports.share(user, id);
  }

  @Patch(':id/send-to-patient')
  @Roles(UserRole.doctor, UserRole.secretary)
  send(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.reports.sendToPatient(user, id);
  }
}
