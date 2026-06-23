import { IsDefined, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class TeleconsultSignalDto {
  @IsIn(['offer', 'answer', 'ice', 'hangup'])
  type!: 'offer' | 'answer' | 'ice' | 'hangup';

  /** SDP / ICE — structure libre (évite les rejets @IsObject sur certains payloads WebRTC). */
  @IsDefined()
  @Type(() => Object)
  payload!: Record<string, unknown>;
}
