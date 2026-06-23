import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DocumentsListService } from './documents-list.service';
import { DocumentStorageService } from './document-storage.service';
import { MedicationsService } from './medications.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly list: DocumentsListService,
    private readonly storage: DocumentStorageService,
    private readonly medications: MedicationsService,
    private readonly jwt: JwtService,
  ) {}

  @Get('medications/search')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor)
  @ApiBearerAuth()
  searchMedications(@Query('q') q: string) {
    return this.medications.search(q ?? '');
  }

  @Get('list')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  unified(
    @ReqUser() user: RequestUser,
    @Query('patientId') patientId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.list.listUnified(user, { patientId, type, from, to });
  }

  @Get('export-zip')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.doctor, UserRole.secretary)
  @ApiBearerAuth()
  async exportZip(@ReqUser() user: RequestUser, @Query('patientId') patientId: string | undefined, @Res() res: Response) {
    const { buffer, filename } = await this.list.exportZip(user, patientId);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('download')
  async download(@Query('token') token: string, @Res() res: Response) {
    const payload = await this.jwt.verifyAsync<{ typ?: string; ref?: string }>(token);
    if (payload.typ !== 'doc_dl' || !payload.ref) {
      res.status(403).send('Invalid token');
      return;
    }
    const buf = await this.storage.readPdf(payload.ref);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    res.send(buf);
  }
}
