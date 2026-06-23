import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsService } from './doctor-tools.service';
import { DoctorToolsImagesService } from './doctor-tools-images.service';
import { SendPatientMessageDto } from './dto/send-patient-message.dto';
import { CreateMedicalReportDto } from './dto/create-medical-report.dto';
import { UpdateMedicalReportDto } from './dto/update-medical-report.dto';
import { CreateReferralLetterDto } from './dto/create-referral-letter.dto';
import { UpdateReferralLetterDto } from './dto/update-referral-letter.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AiChatDto } from './dto/ai-chat.dto';
import { CreateMedicalImageDto } from './dto/create-medical-image.dto';

@ApiTags('Doctor tools')
@Controller('doctor-tools')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class DoctorToolsController {
  constructor(
    private readonly tools: DoctorToolsService,
    private readonly images: DoctorToolsImagesService,
  ) {}

  @Get('messages')
  @Roles(UserRole.doctor, UserRole.secretary)
  listMessages(
    @ReqUser() user: RequestUser,
    @Query('patientId') patientId?: string,
  ) {
    return this.tools.listMessages(user, patientId);
  }

  @Post('messages')
  @Roles(UserRole.doctor, UserRole.secretary)
  sendMessage(@ReqUser() user: RequestUser, @Body() dto: SendPatientMessageDto) {
    return this.tools.sendMessage(user, dto);
  }

  @Get('reports')
  @Roles(UserRole.doctor)
  listReports(@ReqUser() user: RequestUser, @Query('patientId') patientId?: string) {
    return this.tools.listReports(user, patientId);
  }

  @Post('reports')
  @Roles(UserRole.doctor)
  createReport(@ReqUser() user: RequestUser, @Body() dto: CreateMedicalReportDto) {
    return this.tools.createReport(user, dto);
  }

  @Get('reports/:id')
  @Roles(UserRole.doctor)
  getReport(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tools.getReport(user, id);
  }

  @Patch('reports/:id')
  @Roles(UserRole.doctor)
  updateReport(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicalReportDto,
  ) {
    return this.tools.updateReport(user, id, dto);
  }

  @Get('referral-letters')
  @Roles(UserRole.doctor)
  listReferrals(@ReqUser() user: RequestUser, @Query('patientId') patientId?: string) {
    return this.tools.listReferrals(user, patientId);
  }

  @Post('referral-letters')
  @Roles(UserRole.doctor)
  createReferral(@ReqUser() user: RequestUser, @Body() dto: CreateReferralLetterDto) {
    return this.tools.createReferral(user, dto);
  }

  @Patch('referral-letters/:id')
  @Roles(UserRole.doctor)
  updateReferral(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReferralLetterDto,
  ) {
    return this.tools.updateReferral(user, id, dto);
  }

  @Post('referral-letters/:id/send')
  @Roles(UserRole.doctor)
  sendReferral(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tools.sendReferral(user, id);
  }

  @Get('medical-images')
  @Roles(UserRole.doctor)
  listImages(
    @ReqUser() user: RequestUser,
    @Query('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.images.listByPatient(user, patientId);
  }

  @Post('medical-images')
  @Roles(UserRole.doctor)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _req: Express.Request,
          _file: Express.Multer.File,
          cb: (err: Error | null, path: string) => void,
        ) => {
          const dest = join(process.cwd(), 'uploads', 'medical-images');
          mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (
          _req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.dcm'].includes(ext)) {
          cb(new BadRequestException('Formats : JPG, PNG, WebP, PDF'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  uploadImage(
    @ReqUser() user: RequestUser,
    @Query('patientId', ParseUUIDPipe) patientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('consultationId') consultationId?: string,
    @Query('examType') examType?: string,
    @Query('title') title?: string,
    @Query('notes') notes?: string,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');
    const dto: CreateMedicalImageDto = {
      patientId,
      consultationId,
      examType,
      title,
      notes,
    };
    const url = `/uploads/medical-images/${file.filename}`;
    return this.images.registerUpload(user, dto, url, file.mimetype);
  }

  @Post('medical-images/:id/analyze')
  @Roles(UserRole.doctor)
  analyzeImage(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.images.analyze(user, id);
  }

  @Post('ai/chat')
  @Roles(UserRole.doctor)
  aiChat(@ReqUser() user: RequestUser, @Body() dto: AiChatDto) {
    return this.tools.aiChat(user, dto);
  }

  @Get('webhooks')
  @Roles(UserRole.doctor)
  listWebhooks(@ReqUser() user: RequestUser) {
    return this.tools.listWebhooks(user);
  }

  @Post('webhooks')
  @Roles(UserRole.doctor)
  createWebhook(@ReqUser() user: RequestUser, @Body() dto: CreateWebhookDto) {
    return this.tools.createWebhook(user, dto);
  }

  @Patch('webhooks/:id')
  @Roles(UserRole.doctor)
  updateWebhook(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.tools.updateWebhook(user, id, dto);
  }

  @Delete('webhooks/:id')
  @Roles(UserRole.doctor)
  deleteWebhook(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tools.deleteWebhook(user, id);
  }

  @Post('webhooks/:id/test')
  @Roles(UserRole.doctor)
  testWebhook(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tools.testWebhook(user, id);
  }

  @Get('webhooks/:id/logs')
  @Roles(UserRole.doctor)
  webhookLogs(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tools.webhookLogs(user, id);
  }

  @Get('api-keys')
  @Roles(UserRole.doctor)
  listApiKeys(@ReqUser() user: RequestUser) {
    return this.tools.listApiKeys(user);
  }

  @Post('api-keys')
  @Roles(UserRole.doctor)
  createApiKey(@ReqUser() user: RequestUser, @Body() dto: CreateApiKeyDto) {
    return this.tools.createApiKey(user, dto);
  }

  @Delete('api-keys/:id')
  @Roles(UserRole.doctor)
  revokeApiKey(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tools.revokeApiKey(user, id);
  }
}
