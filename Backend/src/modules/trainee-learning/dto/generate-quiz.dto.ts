import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class GenerateQuizDto {
  @IsString()
  topic!: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(10)
  questionCount?: number;
}
