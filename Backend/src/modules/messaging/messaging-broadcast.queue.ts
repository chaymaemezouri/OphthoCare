import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  MESSAGING_BROADCAST_QUEUE,
  type MessagingBroadcastJob,
} from './messaging-broadcast.processor';

@Injectable()
export class MessagingBroadcastQueue {
  constructor(
    @InjectQueue(MESSAGING_BROADCAST_QUEUE) private readonly queue: Queue<MessagingBroadcastJob>,
  ) {}

  add(job: MessagingBroadcastJob) {
    return this.queue.add('send', job, {
      attempts: 2,
      removeOnComplete: 50,
    });
  }
}
