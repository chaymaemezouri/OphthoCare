import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Anti double-réservation : SETNX `slot:{doctorId}:{siteId}:{startMs}` TTL 10 min (spec §2.5).
 * Sans Redis configuré, les verrous sont ignorés (overlap reste bloqué en base).
 */
@Injectable()
export class SlotLockService implements OnModuleDestroy {
  private readonly redis: Redis | null;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL')?.trim();
    const host = this.config.get<string>('REDIS_HOST')?.trim();
    if (url) {
      this.redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
    } else if (host) {
      this.redis = new Redis({
        host,
        port: Number(this.config.get<string>('REDIS_PORT') ?? '6379'),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } else {
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  private key(doctorId: string, siteId: string, start: Date) {
    return `slot:${doctorId}:${siteId}:${start.getTime()}`;
  }

  /** true si le verrou a été acquis */
  async acquire(doctorId: string, siteId: string, start: Date): Promise<boolean> {
    if (!this.redis) return true;
    try {
      const r = await this.redis.set(this.key(doctorId, siteId, start), '1', 'EX', 600, 'NX');
      return r === 'OK';
    } catch {
      return true;
    }
  }

  async release(doctorId: string, siteId: string, start: Date): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(this.key(doctorId, siteId, start));
    } catch {
      /* ignore */
    }
  }
}
