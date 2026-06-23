import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '@/modules/auth/auth.module';
import { DoctorToolsModule } from '@/modules/doctor-tools/doctor-tools.module';
import { PatientsModule } from '@/modules/patients/patients.module';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTemplateService } from './document-template.service';
import { DocumentPdfService } from './document-pdf.service';
import { ReceiptNumberService } from './receipt-number.service';
import { PrescriptionsDocumentsService } from './prescriptions-documents.service';
import { PaymentReceiptsDocumentsService } from './payment-receipts-documents.service';
import { ReportsDocumentsService } from './reports-documents.service';
import { MedicationsService } from './medications.service';
import { PublicVerifyService } from './public-verify.service';
import { DocumentsListService } from './documents-list.service';
import { DOCUMENT_PDF_QUEUE, DocumentsPdfProcessor } from './documents-pdf.processor';
import { DocumentsPdfQueue } from './documents-pdf.queue';
import { PrescriptionsController } from './prescriptions.controller';
import { ReceiptsController } from './receipts.controller';
import { ReportsController } from './reports.controller';
import { DocumentsController } from './documents.controller';
import { PublicVerifyController } from './public-verify.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    DoctorToolsModule,
    PatientsModule,
    BullModule.registerQueue({ name: DOCUMENT_PDF_QUEUE }),
  ],
  controllers: [
    PrescriptionsController,
    ReceiptsController,
    ReportsController,
    DocumentsController,
    PublicVerifyController,
  ],
  providers: [
    DocumentStorageService,
    DocumentTemplateService,
    DocumentPdfService,
    ReceiptNumberService,
    PrescriptionsDocumentsService,
    PaymentReceiptsDocumentsService,
    ReportsDocumentsService,
    MedicationsService,
    PublicVerifyService,
    DocumentsListService,
    DocumentsPdfProcessor,
    DocumentsPdfQueue,
    RoleGuard,
  ],
  exports: [DocumentPdfService, DocumentsPdfQueue],
})
export class DocumentsModule {}
