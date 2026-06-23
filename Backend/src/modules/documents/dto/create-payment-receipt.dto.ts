import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentReceiptMethod, PaymentReceiptStatus } from '@prisma/client';

export class CreatePaymentReceiptDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsString()
  actType!: string;

  @IsString()
  actLabel!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PaymentReceiptStatus)
  status?: PaymentReceiptStatus;

  @IsOptional()
  @IsEnum(PaymentReceiptMethod)
  paymentMethod?: PaymentReceiptMethod;
}
