import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateReceiptPaymentDto {
  @IsIn(['paid', 'pending', 'partial'])
  paymentStatus!: 'paid' | 'pending' | 'partial';

  @IsOptional()
  @IsIn(['card', 'cash', 'transfer', 'check', 'other'])
  paymentMethod?: 'card' | 'cash' | 'transfer' | 'check' | 'other';

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;
}
