import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { createReadStream, mkdirSync, renameSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { SanitizedUser } from '@/modules/users/users.service';
import { DoctorsService } from './doctors.service';
import { DoctorAnalyticsService } from './doctor-analytics.service';
import { DoctorBillingService } from './doctor-billing.service';
import { DoctorStaffService } from './doctor-staff.service';
import { CreateDoctorStaffDto } from './dto/create-doctor-staff.dto';
import { UpdateDoctorStaffDto } from './dto/update-doctor-staff.dto';
import { UpdateReceiptPaymentDto } from './dto/update-receipt-payment.dto';
import { CreateBillingReceiptDto } from './dto/create-billing-receipt.dto';
import { DoctorsSpaceService } from './doctors-space.service';
import { UpdateDoctorMeDto } from './dto/update-doctor-me.dto';
import { ImportIcsDto } from './dto/import-ics.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { CreateDoctorSiteDto } from './dto/create-doctor-site.dto';
import { UpdateDoctorSiteDto } from './dto/update-doctor-site.dto';
import { PatchSiteWorkingHoursDto } from './dto/patch-site-working-hours.dto';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly doctorAnalyticsService: DoctorAnalyticsService,
    private readonly doctorBillingService: DoctorBillingService,
    private readonly doctorStaffService: DoctorStaffService,
    private readonly doctorsSpaceService: DoctorsSpaceService,
  ) {}

  @Get('availability-multi')
  async availabilityMulti(
    @Query('date') date: string,
    @Query('doctorIds') doctorIds?: string,
  ) {
    if (!date) throw new BadRequestException('Query date (YYYY-MM-DD) requis');
    const ids = (doctorIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) throw new BadRequestException('doctorIds requis (liste séparée par des virgules)');
    return this.doctorsService.getAvailabilityMulti(ids, date);
  }

  @Get('search')
  async search(
    @Query('specialtyCode') specialtyCode?: string,
    @Query('specialty') specialty?: string,
    @Query('city') city?: string,
    @Query('q') q?: string,
    @Query('minRating') minRating?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('isVerified') isVerified?: string,
    @Query('isCertified') isCertified?: string,
    @Query('availableOn') availableOn?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const mr = minRating != null && minRating !== '' ? parseFloat(minRating) : undefined;
    const mp = maxPrice != null && maxPrice !== '' ? parseFloat(maxPrice) : undefined;
    let verified: boolean | undefined;
    if (isVerified === 'true') verified = true;
    else if (isVerified === 'false') verified = false;
    let certified: boolean | undefined;
    if (isCertified === 'true') certified = true;

    return this.doctorsService.search({
      specialtyCode: specialtyCode ?? specialty,
      city,
      q,
      minRating: mr != null && !Number.isNaN(mr) ? mr : undefined,
      maxPrice: mp != null && !Number.isNaN(mp) ? mp : undefined,
      isVerified: verified,
      isCertified: certified,
      availableOn: availableOn?.trim() || undefined,
      skip: skip != null && skip !== '' ? parseInt(skip, 10) || 0 : 0,
      take: take != null && take !== '' ? parseInt(take, 10) || 50 : 50,
    });
  }

  @Post('search/reindex')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  async reindexSearch() {
    return this.doctorsService.reindexSearchEngine();
  }

  @Get('search/specialties')
  async searchSpecialties() {
    return this.doctorsService.searchFilterSpecialties();
  }

  @Get('search/cities')
  async searchCities() {
    return this.doctorsService.searchFilterCities();
  }

  @Get('availability')
  async availabilityByQuery(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    const id = doctorId?.trim();
    if (!id) throw new BadRequestException('Query doctorId requis');
    if (!date?.trim()) throw new BadRequestException('Query date (YYYY-MM-DD) requis');
    return this.doctorsService.getAvailability(id, date.trim());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async getMe(@ReqUser() user: SanitizedUser) {
    return this.doctorsService.getMe(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async patchMe(@ReqUser() user: SanitizedUser, @Body() dto: UpdateDoctorMeDto) {
    return this.doctorsService.updateMe(user.id, dto);
  }

  @Get('me/staff')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async listStaff(@ReqUser() user: SanitizedUser) {
    return this.doctorStaffService.listStaff(user);
  }

  @Post('me/staff')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async createStaff(@ReqUser() user: SanitizedUser, @Body() dto: CreateDoctorStaffDto) {
    return this.doctorStaffService.createStaff(user, dto);
  }

  @Patch('me/staff/:userId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async updateStaff(
    @ReqUser() user: SanitizedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateDoctorStaffDto,
  ) {
    return this.doctorStaffService.updateStaff(user, userId, dto);
  }

  @Delete('me/staff/:userId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async removeStaff(
    @ReqUser() user: SanitizedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.doctorStaffService.removeStaff(user, userId);
  }

  @Get('me/sites')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async mySites(@ReqUser() user: SanitizedUser) {
    return this.doctorsSpaceService.listSites(user.id);
  }

  @Post('me/sites')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async createSite(@ReqUser() user: SanitizedUser, @Body() dto: CreateDoctorSiteDto) {
    return this.doctorsSpaceService.createSite(user.id, dto);
  }

  @Patch('me/sites/:siteId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async updateSite(
    @ReqUser() user: SanitizedUser,
    @Param('siteId') siteId: string,
    @Body() dto: UpdateDoctorSiteDto,
  ) {
    return this.doctorsSpaceService.updateSite(user.id, siteId, dto);
  }

  @Delete('me/sites/:siteId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async deleteSite(@ReqUser() user: SanitizedUser, @Param('siteId') siteId: string) {
    return this.doctorsSpaceService.deleteSite(user.id, siteId);
  }

  @Patch('me/sites/:siteId/working-hours')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async patchSiteHours(
    @ReqUser() user: SanitizedUser,
    @Param('siteId') siteId: string,
    @Body() dto: PatchSiteWorkingHoursDto,
  ) {
    return this.doctorsSpaceService.patchSiteWorkingHours(user.id, siteId, dto);
  }

  @Get('me/tariffs')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async myTariffs(@ReqUser() user: SanitizedUser, @Query('siteId') siteId?: string) {
    return this.doctorsSpaceService.listTariffs(user.id, siteId);
  }

  @Post('me/tariffs')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async createTariff(@ReqUser() user: SanitizedUser, @Body() dto: CreateTariffDto) {
    return this.doctorsSpaceService.createTariff(user.id, dto);
  }

  @Patch('me/tariffs/:tariffId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async updateTariff(
    @ReqUser() user: SanitizedUser,
    @Param('tariffId') tariffId: string,
    @Body() dto: UpdateTariffDto,
  ) {
    return this.doctorsSpaceService.updateTariff(user.id, tariffId, dto);
  }

  @Get('me/analytics')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async myAnalytics(
    @ReqUser() user: SanitizedUser,
    @Query('period') period?: string,
  ) {
    return this.doctorAnalyticsService.getMeAnalytics(user, period);
  }

  @Get('me/billing')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async myBilling(
    @ReqUser() user: SanitizedUser,
    @Query('period') period?: string,
    @Query('status') status?: string,
  ) {
    return this.doctorBillingService.getMeBilling(user, period, status);
  }

  @Post('me/billing/receipts')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async createBillingReceipt(
    @ReqUser() user: SanitizedUser,
    @Body() dto: CreateBillingReceiptDto,
  ) {
    return this.doctorBillingService.createReceipt(user, dto);
  }

  @Patch('me/billing/receipts/:receiptId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async updateBillingReceipt(
    @ReqUser() user: SanitizedUser,
    @Param('receiptId', ParseUUIDPipe) receiptId: string,
    @Body() dto: UpdateReceiptPaymentDto,
  ) {
    return this.doctorBillingService.updateReceiptPayment(user, receiptId, dto);
  }

  @Get('me/appointments')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async myAppointments(
    @ReqUser() user: SanitizedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.doctorsService.listAppointmentsForDoctor(user, from, to);
  }

  @Get('me/patients')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async myPatients(
    @ReqUser() user: SanitizedUser,
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.doctorsService.listPatientsForDoctor(user.id, {
      q: q?.trim(),
      skip: skip != null && skip !== '' ? parseInt(skip, 10) || 0 : 0,
      take: take != null && take !== '' ? parseInt(take, 10) || 20 : 20,
    });
  }

  @Post('me/calendar/ics')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async importIcs(@ReqUser() user: SanitizedUser, @Body() dto: ImportIcsDto) {
    return this.doctorsService.importIcsWorkingHours(user.id, dto.icsText);
  }

  @Post('me/photo')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Express.Request, _file: Express.Multer.File, cb: (err: Error | null, path: string) => void) => {
          const dest = join(process.cwd(), 'uploads', 'doctors');
          mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          cb(new BadRequestException('Formats acceptés : JPG, PNG, WebP'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadPhoto(
    @ReqUser() user: SanitizedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');
    const url = `/uploads/doctors/${file.filename}`;
    await this.doctorsService.setProfilePhotoUrl(user.id, url);
    return { profilePhotoUrl: url };
  }

  @Patch('me/photo')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Express.Request, _file: Express.Multer.File, cb: (err: Error | null, path: string) => void) => {
          const dest = join(process.cwd(), 'uploads', 'doctors');
          mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          cb(new BadRequestException('Formats acceptés : JPG, PNG, WebP'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadPhotoPatch(
    @ReqUser() user: SanitizedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');
    const url = `/uploads/doctors/${file.filename}`;
    await this.doctorsService.setProfilePhotoUrl(user.id, url);
    return { profilePhotoUrl: url };
  }

  private async finalizeSignatureUpload(userId: string, file: Express.Multer.File) {
    const doctorId = await this.doctorsService.findDoctorIdForUser(userId);
    if (!doctorId) throw new BadRequestException('Profil médecin introuvable');
    const destDir = join(process.cwd(), 'private', 'doctor-signatures', doctorId);
    mkdirSync(destDir, { recursive: true });
    const finalName = file.filename;
    const destPath = join(destDir, finalName);
    renameSync(file.path, destPath);
    const ref = `private:sig:${doctorId}/${finalName}`;
    await this.doctorsService.setSignaturePrivateRef(userId, ref);
    return { hasSignature: true };
  }

  @Post('me/signature')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Express.Request, _file: Express.Multer.File, cb: (err: Error | null, path: string) => void) => {
          const dest = join(process.cwd(), 'private', 'doctor-signatures', '_staging');
          mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase() || '.png'}`);
        },
      }),
      limits: { fileSize: 200 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ext !== '.png') {
          cb(new BadRequestException('Signature : fichier PNG uniquement (≤ 200 Ko)'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadSignaturePost(@ReqUser() user: SanitizedUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fichier requis');
    return this.finalizeSignatureUpload(user.id, file);
  }

  @Patch('me/signature')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Express.Request, _file: Express.Multer.File, cb: (err: Error | null, path: string) => void) => {
          const dest = join(process.cwd(), 'private', 'doctor-signatures', '_staging');
          mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase() || '.png'}`);
        },
      }),
      limits: { fileSize: 200 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ext !== '.png') {
          cb(new BadRequestException('Signature : fichier PNG uniquement (≤ 200 Ko)'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadSignaturePatch(@ReqUser() user: SanitizedUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fichier requis');
    return this.finalizeSignatureUpload(user.id, file);
  }

  @Get('me/signature/file')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  async downloadSignature(@ReqUser() user: SanitizedUser) {
    const path = await this.doctorsService.getSignatureAbsolutePathForDownload(user.id);
    const stream = createReadStream(path);
    return new StreamableFile(stream, {
      type: 'image/png',
      disposition: 'inline; filename="signature.png"',
    });
  }

  @Get('me/appointments.ics')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async exportMyIcs(
    @ReqUser() user: SanitizedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.doctorsService.exportAppointmentsIcs(user, from, to);
  }

  @Get('me/calendar.ics')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async exportMyCalendarIcs(
    @ReqUser() user: SanitizedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.doctorsService.exportAppointmentsIcs(user, from, to);
  }

  @Get('me/schedule-blocks')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async listBlocks(
    @ReqUser() user: SanitizedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.doctorsService.listMyScheduleBlocks(user, from, to);
  }

  @Post('me/schedule-blocks')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async createBlock(@ReqUser() user: SanitizedUser, @Body() dto: CreateScheduleBlockDto) {
    return this.doctorsService.createMyScheduleBlock(user, dto);
  }

  @Delete('me/schedule-blocks/:blockId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async deleteBlock(@ReqUser() user: SanitizedUser, @Param('blockId') blockId: string) {
    return this.doctorsService.deleteMyScheduleBlock(user, blockId);
  }

  @Post('me/calendar-sync')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async calendarSync(@ReqUser() user: SanitizedUser, @Body('provider') provider?: string) {
    return this.doctorsService.calendarSyncStub(user, provider);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  async create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.createByAdmin(dto);
  }

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.doctorsService.findAll(
      skip ? parseInt(skip, 10) || 0 : 0,
      take ? parseInt(take, 10) || 20 : 20,
    );
  }

  @Get(':id/public-profile')
  async publicProfile(@Param('id') id: string) {
    return this.doctorsService.findPublicProfile(id);
  }

  @Get(':id/availability')
  async availability(@Param('id') id: string, @Query('date') date: string) {
    if (!date) throw new BadRequestException('Query date (YYYY-MM-DD) requis');
    return this.doctorsService.getAvailability(id, date);
  }

  @Get(':id/sites/:siteId/availability')
  async availabilityForSite(
    @Param('id') id: string,
    @Param('siteId') siteId: string,
    @Query('date') date: string,
    @Query('duration') duration?: string,
  ) {
    if (!date) throw new BadRequestException('Query date (YYYY-MM-DD) requis');
    const d =
      duration != null && duration !== '' && !Number.isNaN(parseInt(duration, 10))
        ? parseInt(duration, 10)
        : undefined;
    return this.doctorsService.getAvailabilityForSite(id, siteId, date, d);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  async updateAdmin(@Param('id') id: string, @Body() dto: UpdateDoctorMeDto) {
    return this.doctorsService.updateByAdmin(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  async deleteAdmin(@Param('id') id: string) {
    return this.doctorsService.softDeleteByAdmin(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findById(id);
  }
}
