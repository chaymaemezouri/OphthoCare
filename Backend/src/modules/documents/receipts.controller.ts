import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { CreatePaymentReceiptDto } from './dto/create-payment-receipt.dto';
import { PatchPaymentReceiptDto } from './dto/patch-payment-receipt.dto';
import { PaymentReceiptsDocumentsService } from './payment-receipts-documents.service';

@ApiTags('Receipts')
@Controller('receipts')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(private readonly receipts: PaymentReceiptsDocumentsService) {}

  @Post()
  @Roles(UserRole.doctor, UserRole.secretary)
  create(@ReqUser() user: RequestUser, @Body() dto: CreatePaymentReceiptDto) {
    return this.receipts.create(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.doctor, UserRole.secretary)
  patch(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchPaymentReceiptDto,
  ) {
    return this.receipts.patch(user, id, dto);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient)
  listPatient(@ReqUser() user: RequestUser, @Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.receipts.listForPatient(user, patientId);
  }

  @Get('export')
  @Roles(UserRole.doctor, UserRole.secretary)
  async export(
    @ReqUser() user: RequestUser,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.receipts.exportExcel(user, month);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('totals/today')
  @Roles(UserRole.doctor, UserRole.secretary)
  dayTotals(@ReqUser() user: RequestUser) {
    return this.receipts.dayTotals(user);
  }
}
