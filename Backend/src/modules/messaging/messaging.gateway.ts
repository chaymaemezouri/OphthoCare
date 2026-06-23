import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '@/modules/auth/auth.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { MessagingService } from './messaging.service';

type AuthedSocket = Socket & { data: { user?: RequestUser } };

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly log = new Logger(MessagingGateway.name);
  private readonly typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly messaging: MessagingService,
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    const user = await this.authenticate(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    if (user.role === UserRole.trainee || user.role === UserRole.admin) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    const convIds = await this.messaging.conversationIdsForUser(user);
    for (const id of convIds) {
      await client.join(id);
    }
    const total = await this.messaging.getUnreadTotal(user);
    client.emit('unreadCount', { total });
    this.log.debug(`WS connected ${user.id} (${user.role}), rooms=${convIds.length}`);
  }

  handleDisconnect(client: AuthedSocket) {
    const uid = client.data.user?.id;
    if (uid) {
      for (const key of [...this.typingTimers.keys()]) {
        if (key.startsWith(`${uid}:`)) this.typingTimers.delete(key);
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId?: string; content?: string },
  ) {
    const user = client.data.user;
    if (!user || !body?.conversationId || !body?.content) return;
    const msg = await this.messaging.sendMessage(user, body.conversationId, body.content);
    this.server.to(body.conversationId).emit('newMessage', msg);
    const staffTotal = await this.messaging.getUnreadTotal({
      ...user,
      role: UserRole.doctor,
      doctorSpaceId: user.doctorSpaceId,
    });
    if (user.role === UserRole.patient) {
      this.server.to(body.conversationId).emit('unreadCount', { total: staffTotal });
    }
    return msg;
  }

  @SubscribeMessage('markRead')
  async onMarkRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { messageId?: string },
  ) {
    const user = client.data.user;
    if (!user || !body?.messageId) return;
    const res = await this.messaging.markMessageRead(user, body.messageId);
    if (res.conversationId) {
      this.server.to(res.conversationId).emit('messageReadAck', { messageId: body.messageId });
    }
    const total = await this.messaging.getUnreadTotal(user);
    client.emit('unreadCount', { total });
    return res;
  }

  @SubscribeMessage('typing')
  onTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId?: string; isTyping?: boolean },
  ) {
    const user = client.data.user;
    if (!user || !body?.conversationId) return;
    const key = `${user.id}:${body.conversationId}`;
    if (this.typingTimers.has(key)) clearTimeout(this.typingTimers.get(key)!);
    client.to(body.conversationId).emit('typingStatus', {
      conversationId: body.conversationId,
      userId: user.id,
      isTyping: Boolean(body.isTyping),
    });
    if (body.isTyping) {
      this.typingTimers.set(
        key,
        setTimeout(() => {
          client.to(body.conversationId!).emit('typingStatus', {
            conversationId: body.conversationId,
            userId: user.id,
            isTyping: false,
          });
          this.typingTimers.delete(key);
        }, 4000),
      );
    }
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server.to(conversationId).emit(event, payload);
  }

  private async authenticate(client: Socket): Promise<RequestUser | null> {
    const auth = client.handshake.auth as { token?: string };
    const header = client.handshake.headers.authorization;
    const raw =
      auth?.token ||
      (typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : null);
    if (!raw) return null;
    try {
      const payload = this.jwt.verify<{ sub: string }>(raw);
      return await this.auth.validateRequestUser(payload.sub);
    } catch {
      return null;
    }
  }
}
