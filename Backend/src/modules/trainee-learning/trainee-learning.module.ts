import { Module } from '@nestjs/common';
import { PatientsModule } from '@/modules/patients/patients.module';
import { TraineeLearningController } from './trainee-learning.controller';
import { TraineeLearningService } from './trainee-learning.service';
import { TraineeLearningContextService } from './trainee-learning-context.service';

@Module({
  imports: [PatientsModule],
  controllers: [TraineeLearningController],
  providers: [TraineeLearningService, TraineeLearningContextService],
  exports: [TraineeLearningService],
})
export class TraineeLearningModule {}
