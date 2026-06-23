import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TraineeSessionType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { TraineeLearningService } from './trainee-learning.service';
import { TraineeAiChatDto } from './dto/trainee-ai-chat.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@ApiTags('Trainee learning')
@Controller('trainee-learning')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.trainee)
@ApiBearerAuth()
export class TraineeLearningController {
  constructor(private readonly learning: TraineeLearningService) {}

  @Post('ai/chat')
  aiChat(@ReqUser() user: RequestUser, @Body() dto: TraineeAiChatDto) {
    return this.learning.aiChat(user, dto);
  }

  @Post('quiz/generate')
  generateQuiz(@ReqUser() user: RequestUser, @Body() dto: GenerateQuizDto) {
    return this.learning.generateQuiz(user, dto);
  }

  @Post('quiz/:sessionId/submit')
  submitQuiz(
    @ReqUser() user: RequestUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.learning.submitQuiz(user, sessionId, dto);
  }

  @Get('sessions')
  listSessions(
    @ReqUser() user: RequestUser,
    @Query('type') type?: TraineeSessionType,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.learning.listSessions(user, {
      type,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('progress')
  getProgress(@ReqUser() user: RequestUser) {
    return this.learning.getProgress(user);
  }

  @Get('medical-images/patient/:patientId')
  listImages(
    @ReqUser() user: RequestUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.learning.listMedicalImages(user, patientId);
  }

  @Post('medical-images/:id/explain')
  explainImage(
    @ReqUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.learning.explainMedicalImage(user, id);
  }
}
