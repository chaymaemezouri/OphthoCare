import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/req-user.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@Controller('messaging')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get('unread-total')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient)
  unreadTotal(@ReqUser() user: RequestUser) {
    return this.messaging.getUnreadTotal(user).then((total) => ({ total }));
  }

  @Get('eligible-spaces')
  @Roles(UserRole.patient)
  eligibleSpaces(@ReqUser() user: RequestUser) {
    return this.messaging.listEligibleSpacesForPatient(user);
  }

  @Get('conversations')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient)
  listConversations(@ReqUser() user: RequestUser) {
    return this.messaging.listConversations(user);
  }

  @Post('conversations')
  @Roles(UserRole.patient)
  createConversation(@ReqUser() user: RequestUser, @Body() dto: CreateConversationDto) {
    return this.messaging.createConversation(user, dto.doctorSpaceId);
  }

  @Get('conversations/:id/messages')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient)
  getMessages(
    @ReqUser() user: RequestUser,
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const n = limit ? parseInt(limit, 10) : 30;
    return this.messaging.getMessages(user, conversationId, cursor, Number.isFinite(n) ? n : 30);
  }

  @Patch('messages/:id/read')
  @Roles(UserRole.doctor, UserRole.secretary, UserRole.patient)
  markRead(@ReqUser() user: RequestUser, @Param('id', ParseUUIDPipe) messageId: string) {
    return this.messaging.markMessageRead(user, messageId);
  }

  @Post('broadcast')
  @Roles(UserRole.doctor)
  broadcast(@ReqUser() user: RequestUser, @Body() dto: SendBroadcastDto) {
    return this.messaging.broadcast(user, dto);
  }
}
