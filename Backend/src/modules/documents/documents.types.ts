export type DocumentKind = 'prescription' | 'receipt' | 'report';

export type MedicationLine = {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

export type DocumentHeaderContext = {
  doctorName: string;
  specialtyName: string;
  orderNumber?: string | null;
  siteName?: string | null;
  siteAddress?: string | null;
  sitePhone?: string | null;
  platformName: string;
};

export type DocumentRenderPayload = {
  title: string;
  patientName: string;
  patientDob?: string | null;
  bodyHtml: string;
  footerNumber?: string | null;
  verifyUrl: string;
  generatedAt: string;
  signatureDataUrl?: string | null;
};
