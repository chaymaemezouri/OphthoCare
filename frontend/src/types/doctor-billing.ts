export type BillingPeriod = 'day' | 'month' | 'year';
export type PaymentStatus = 'paid' | 'pending' | 'partial';
export type PaymentMethod = 'card' | 'cash' | 'transfer' | 'check' | 'other';

export type DoctorBillingItem = {
  receiptId: string;
  consultationId: string;
  reference: string;
  patientDisplayName: string;
  date: string;
  amount: number;
  paidAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentMethodLabel: string;
};

export type DoctorBillingResponse = {
  period: BillingPeriod;
  range: { from: string; to: string };
  currency: string;
  summary: {
    todayRevenue: number;
    todayRevenueChangePercent: number | null;
    unpaidTotal: number;
    unpaidCount: number;
    receiptsInPeriod: number;
    periodRevenue: number;
    periodRevenueChangePercent: number | null;
    preferredPaymentMethod: string | null;
  };
  items: DoctorBillingItem[];
  pendingConsultations: {
    consultationId: string;
    patientDisplayName: string;
    closedAt: string;
    suggestedAmount: number;
    currency: string;
  }[];
};
