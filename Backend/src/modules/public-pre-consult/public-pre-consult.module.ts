import { Module } from '@nestjs/common';
import { SpecialtiesModule } from '@/modules/specialties/specialties.module';
import { PublicPreConsultController } from './public-pre-consult.controller';
import { PublicPreConsultService } from './public-pre-consult.service';

@Module({
  imports: [SpecialtiesModule],
  controllers: [PublicPreConsultController],
  providers: [PublicPreConsultService],
  exports: [PublicPreConsultService],
})
export class PublicPreConsultModule {}
