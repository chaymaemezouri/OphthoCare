import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class TraineeChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class TraineeAiChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TraineeChatMessageDto)
  messages!: TraineeChatMessageDto[];

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
