import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicPreConsultService } from './public-pre-consult.service';
import { SubmitPublicPreConsultDto } from './dto/submit-public-pre-consult.dto';

@ApiTags('Public pre-consultation')
@Controller('public/pre-consultation')
export class PublicPreConsultController {
  constructor(private readonly publicPreConsult: PublicPreConsultService) {}

  @Get(':token')
  getByToken(@Param('token') token: string) {
    return this.publicPreConsult.getByToken(token);
  }

  @Put(':token')
  submit(@Param('token') token: string, @Body() dto: SubmitPublicPreConsultDto) {
    return this.publicPreConsult.submitByToken(token, dto.responses);
  }
}
