import { IsEnum, IsString, MinLength } from 'class-validator';
import { BroadcastRecipientFilter } from '@prisma/client';

export class SendBroadcastDto {
  @IsString()
  @MinLength(1)
  subject!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsEnum(BroadcastRecipientFilter)
  recipientFilter!: BroadcastRecipientFilter;
}
