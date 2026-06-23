import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateBillingReceiptDto {
  @IsUUID()
  consultationId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsIn(['paid', 'pending', 'partial'])
  paymentStatus?: 'paid' | 'pending' | 'partial';

  @IsOptional()
  @IsIn(['card', 'cash', 'transfer', 'check', 'other'])
  paymentMethod?: 'card' | 'cash' | 'transfer' | 'check' | 'other';
}
