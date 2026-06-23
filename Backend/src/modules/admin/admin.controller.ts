import {
  Body,
  Controller,
  Delete,
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
import { AdminService } from './admin.service';
import { AdminDoctorsQueryDto } from './dto/admin-doctors-query.dto';
import { SuspendDoctorDto } from './dto/suspend-doctor.dto';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';
import { CreateSpecialtyAdminDto } from '@/modules/specialties/dto/create-specialty-admin.dto';
import { PatchSpecialtyAdminDto } from '@/modules/specialties/dto/patch-specialty-admin.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

const PLATFORM_ADMIN = [UserRole.admin, UserRole.super_admin] as UserRole[];

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles(...PLATFORM_ADMIN)
  getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('doctors')
  @Roles(...PLATFORM_ADMIN)
  listDoctors(@Query() query: AdminDoctorsQueryDto) {
    return this.adminService.listDoctors(query);
  }

  @Get('doctors/:id/stats')
  @Roles(...PLATFORM_ADMIN)
  doctorStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getDoctorStats(id);
  }

  @Patch('doctors/:id/certify')
  @Roles(...PLATFORM_ADMIN)
  certify(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.certifyDoctor(id);
  }

  @Patch('doctors/:id/suspend')
  @Roles(...PLATFORM_ADMIN)
  suspend(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SuspendDoctorDto) {
    return this.adminService.suspendDoctor(id, dto.reason);
  }

  @Patch('doctors/:id/unsuspend')
  @Roles(...PLATFORM_ADMIN)
  unsuspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unsuspendDoctor(id);
  }

  @Get('specialties')
  @Roles(...PLATFORM_ADMIN)
  listSpecialties() {
    return this.adminService.listSpecialtiesWithCounts();
  }

  @Post('specialties')
  @Roles(...PLATFORM_ADMIN)
  createSpecialty(@Body() dto: CreateSpecialtyAdminDto) {
    return this.adminService.createSpecialty(dto);
  }

  @Patch('specialties/:id')
  @Roles(...PLATFORM_ADMIN)
  patchSpecialty(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchSpecialtyAdminDto) {
    return this.adminService.patchSpecialty(id, dto);
  }

  @Delete('specialties/:id')
  @Roles(...PLATFORM_ADMIN)
  deleteSpecialty(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteSpecialty(id);
  }

  @Get('audit-logs')
  @Roles(...PLATFORM_ADMIN)
  auditLogs(@Query() query: AuditLogsQueryDto) {
    return this.adminService.listAuditLogs(query);
  }

  @Get('security/failed-logins')
  @Roles(...PLATFORM_ADMIN)
  failedLogins() {
    return this.adminService.listFailedLoginsGrouped();
  }

  @Get('security/sessions')
  @Roles(...PLATFORM_ADMIN)
  sessions() {
    return this.adminService.listActiveSessions();
  }

  @Delete('security/sessions/:sessionId')
  @Roles(...PLATFORM_ADMIN)
  revokeSession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.adminService.revokeSession(sessionId);
  }

  @Get('moderation/reviews')
  @Roles(...PLATFORM_ADMIN)
  pendingReviews(
    @Query('doctorId') doctorId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('minRating') minRating?: string,
  ) {
    return this.adminService.listPendingReviews({
      doctorId,
      dateFrom,
      dateTo,
      minRating: minRating != null ? parseInt(minRating, 10) : undefined,
    });
  }

  @Patch('moderation/reviews/:id/approve')
  @Roles(...PLATFORM_ADMIN)
  approveReview(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: RequestUser) {
    return this.adminService.approveReview(id, user.id);
  }

  @Patch('moderation/reviews/:id/reject')
  @Roles(...PLATFORM_ADMIN)
  rejectReview(
    @Param('id', ParseUUIDPipe) id: string,
    @ReqUser() user: RequestUser,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.adminService.rejectReview(id, user.id, dto.reason);
  }

  @Post('users')
  @Roles(UserRole.super_admin)
  createAdminUser(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createPlatformAdmin({
      ...dto,
      asSuperAdmin: false,
    });
  }

  @Post('users/super')
  @Roles(UserRole.super_admin)
  createSuperAdmin(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createPlatformAdmin({
      ...dto,
      asSuperAdmin: true,
    });
  }
}
