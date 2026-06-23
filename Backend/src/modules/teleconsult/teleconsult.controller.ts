import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { TeleconsultService } from './teleconsult.service';
import { TeleconsultChatDto } from './dto/teleconsult-chat.dto';
import { TeleconsultSignalDto } from './dto/teleconsult-signal.dto';

@ApiTags('Teleconsult')
@Controller('teleconsult')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class TeleconsultController {
  constructor(private readonly teleconsultService: TeleconsultService) {}

  @Get('appointments')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.admin)
  listAppointments(@ReqUser() user: RequestUser, @Query('date') date?: string) {
    return this.teleconsultService.listVideoAppointments(user, date);
  }

  @Get(':appointmentId/context')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient, UserRole.admin)
  getContext(@ReqUser() user: RequestUser, @Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
    return this.teleconsultService.getContext(user, appointmentId);
  }

  @Post(':appointmentId/join')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient, UserRole.admin)
  join(@ReqUser() user: RequestUser, @Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
    return this.teleconsultService.join(user, appointmentId);
  }

  @Get(':appointmentId/chat')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient, UserRole.admin)
  listChat(
    @ReqUser() user: RequestUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Query('after') after?: string,
  ) {
    return this.teleconsultService.listChat(user, appointmentId, after);
  }

  @Post(':appointmentId/chat')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient, UserRole.admin)
  sendChat(
    @ReqUser() user: RequestUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() dto: TeleconsultChatDto,
  ) {
    return this.teleconsultService.sendChat(user, appointmentId, dto);
  }

  @Get(':appointmentId/signals')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient, UserRole.admin)
  pollSignals(
    @ReqUser() user: RequestUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Query('afterSeq') afterSeq?: string,
  ) {
    const n = afterSeq != null && afterSeq !== '' ? Number(afterSeq) : undefined;
    return this.teleconsultService.pollSignals(user, appointmentId, Number.isFinite(n) ? n : undefined);
  }

  @Post(':appointmentId/signals')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient, UserRole.admin)
  postSignal(
    @ReqUser() user: RequestUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() dto: TeleconsultSignalDto,
  ) {
    return this.teleconsultService.postSignal(user, appointmentId, dto);
  }

  @Post(':appointmentId/end')
  @Roles(UserRole.doctor, UserRole.admin)
  end(
    @ReqUser() user: RequestUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() body?: { notes?: string },
  ) {
    return this.teleconsultService.endSession(user, appointmentId, body?.notes);
  }
}
