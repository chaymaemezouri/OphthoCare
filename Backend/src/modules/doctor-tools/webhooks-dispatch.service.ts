import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class WebhooksDispatchService {
  private readonly log = new Logger(WebhooksDispatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async dispatch(
    doctorSpaceId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const hooks = await this.prisma.webhook.findMany({
      where: {
        doctorSpaceId,
        isActive: true,
        events: { has: event },
      },
    });
    for (const hook of hooks) {
      void this.deliverToWebhook(hook.id, event, payload).catch((e) =>
        this.log.warn(`Webhook ${hook.id}: ${(e as Error).message}`),
      );
    }
  }

  async deliverToWebhook(
    webhookId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const hook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!hook) return;
    await this.deliverOne(hook.id, hook.url, hook.secret, event, payload);
  }

  private async deliverOne(
    webhookId: string,
    url: string,
    secret: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const body = { event, timestamp: new Date().toISOString(), data: payload };
    const raw = JSON.stringify(body);
    const signature = createHmac('sha256', secret).update(raw).digest('hex');
    let status = 'delivered';
    let responseCode: number | undefined;
    let error: string | undefined;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OphthoCare-Event': event,
          'X-OphthoCare-Signature': `sha256=${signature}`,
        },
        body: raw,
        signal: AbortSignal.timeout(12_000),
      });
      responseCode = res.status;
      if (!res.ok) {
        status = 'failed';
        error = `HTTP ${res.status}`;
      }
    } catch (e) {
      status = 'failed';
      error = (e as Error).message;
    }
    await this.prisma.$transaction([
      this.prisma.webhookDeliveryLog.create({
        data: {
          webhookId,
          event,
          payload: body as Prisma.InputJsonValue,
          status,
          responseCode: responseCode ?? null,
          error: error ?? null,
        },
      }),
      this.prisma.webhook.update({
        where: { id: webhookId },
        data: { lastDeliveryAt: new Date() },
      }),
    ]);
  }
}
