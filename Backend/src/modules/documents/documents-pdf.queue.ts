import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DOCUMENT_PDF_QUEUE, type DocumentPdfJob } from './documents-pdf.processor';

@Injectable()
export class DocumentsPdfQueue {
  constructor(@InjectQueue(DOCUMENT_PDF_QUEUE) private readonly queue: Queue<DocumentPdfJob>) {}

  add(job: DocumentPdfJob) {
    return this.queue.add('generate', job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }
}
