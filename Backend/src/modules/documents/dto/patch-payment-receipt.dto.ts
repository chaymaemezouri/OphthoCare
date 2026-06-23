import { IsEnum, IsOptional } from 'class-validator';
import { PaymentReceiptMethod, PaymentReceiptStatus } from '@prisma/client';

export class PatchPaymentReceiptDto {
  @IsOptional()
  @IsEnum(PaymentReceiptStatus)
  status?: PaymentReceiptStatus;

  @IsOptional()
  @IsEnum(PaymentReceiptMethod)
  paymentMethod?: PaymentReceiptMethod;
}
