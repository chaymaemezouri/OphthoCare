import { IsObject } from 'class-validator';

export class SubmitPublicPreConsultDto {
  @IsObject()
  responses!: Record<string, unknown>;
}
