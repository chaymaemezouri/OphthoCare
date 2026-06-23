import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicVerifyService, type VerifyDocType } from './public-verify.service';

@ApiTags('Public verify')
@Controller('public/verify')
export class PublicVerifyController {
  constructor(private readonly verify: PublicVerifyService) {}

  @Get(':type/:uuid')
  check(@Param('type') type: VerifyDocType, @Param('uuid') uuid: string) {
    return this.verify.verify(type, uuid);
  }
}
