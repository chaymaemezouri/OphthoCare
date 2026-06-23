import { IsString, MaxLength } from 'class-validator';

export class ImportIcsDto {
  @IsString()
  @MaxLength(500000)
  icsText: string;
}
