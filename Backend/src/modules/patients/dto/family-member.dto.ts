import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class FamilyMemberDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(80)
  relationship: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be YYYY-MM-DD' })
  dateOfBirth?: string;
}
