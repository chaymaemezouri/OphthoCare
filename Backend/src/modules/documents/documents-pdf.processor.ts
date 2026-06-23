import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { DocumentPdfService } from './document-pdf.service';
import type { DocumentKind } from './documents.types';

export const DOCUMENT_PDF_QUEUE = 'document-pdf';

export type DocumentPdfJob = { kind: DocumentKind; id: string };

@Processor(DOCUMENT_PDF_QUEUE)
export class DocumentsPdfProcessor extends WorkerHost {
  private readonly log = new Logger(DocumentsPdfProcessor.name);

  constructor(private readonly pdf: DocumentPdfService) {
    super();
  }

  async process(job: Job<DocumentPdfJob>): Promise<void> {
    this.log.log(`PDF job ${job.data.kind}/${job.data.id}`);
    await this.pdf.generateAndStore(job.data.kind, job.data.id);
  }
}
