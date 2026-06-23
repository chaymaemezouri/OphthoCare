import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsultationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { SanitizedUser } from '@/modules/users/users.service';
import { DoctorsService } from './doctors.service';
import { UpdateReceiptPaymentDto } from './dto/update-receipt-payment.dto';
import { CreateBillingReceiptDto } from './dto/create-billing-receipt.dto';

export type BillingPeriod = 'day' | 'month' | 'year';
export type PaymentStatus = 'paid' | 'pending' | 'partial';
export type PaymentMethod = 'card' | 'cash' | 'transfer' | 'check' | 'other';

type ReceiptPayload = {
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  patientId?: string;
  doctorId?: string;
  specialtyCode?: string;
  durationSeconds?: number;
  closedAt?: string;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function resolvePeriod(periodRaw?: string, now = new Date()) {
  const period: BillingPeriod =
    periodRaw === 'day' || periodRaw === 'year' ? periodRaw : 'month';
  const to = endOfDay(now);
  let from: Date;
  let prevFrom: Date;
  let prevTo: Date;

  if (period === 'day') {
    from = startOfDay(now);
    prevTo = endOfDay(new Date(from.getTime() - 86400000));
    prevFrom = startOfDay(prevTo);
  } else if (period === 'year') {
    from = startOfDay(new Date(now.getFullYear(), 0, 1));
    prevTo = endOfDay(new Date(from.getTime() - 86400000));
    prevFrom = startOfDay(new Date(prevTo.getFullYear(), 0, 1));
  } else {
    from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    prevTo = endOfDay(new Date(from.getTime() - 86400000));
    prevFrom = startOfDay(new Date(prevTo.getFullYear(), prevTo.getMonth(), 1));
  }
  return { period, from, to, prevFrom, prevTo };
}

function parsePayload(raw: unknown): ReceiptPayload {
  if (!raw || typeof raw !== 'object') return {};
  return raw as ReceiptPayload;
}

function paymentMethodLabel(m?: PaymentMethod | null): string {
  switch (m) {
    case 'card':
      return 'Carte bancaire';
    case 'cash':
      return 'Espèces';
    case 'transfer':
      return 'Virement';
    case 'check':
      return 'Chèque';
    case 'other':
      return 'Autre';
    default:
      return '—';
  }
}

function effectiveStatus(amount: number, payload: ReceiptPayload): PaymentStatus {
  const s = payload.paymentStatus;
  if (s === 'paid' || s === 'pending' || s === 'partial') return s;
  const paid = payload.paidAmount ?? 0;
  if (paid <= 0) return 'pending';
  if (paid >= amount) return 'paid';
  return 'partial';
}

function paidValue(amount: number, payload: ReceiptPayload, status: PaymentStatus): number {
  if (status === 'paid') return amount;
  if (status === 'pending') return 0;
  return Math.min(amount, Math.max(0, payload.paidAmount ?? 0));
}

function receiptReference(id: string) {
  return `REC-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

@Injectable()
export class DoctorBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorsService: DoctorsService,
  ) {}

  async getMeBilling(
    user: SanitizedUser,
    periodRaw?: string,
    statusFilter?: string,
  ) {
    const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
    const { period, from, to, prevFrom, prevTo } = resolvePeriod(periodRaw);
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [receiptRows, pendingConsultations, doctor] = await Promise.all([
      this.prisma.consultationReceipt.findMany({
        where: {
          consultation: { doctorId, status: ConsultationStatus.completed },
          createdAt: { gte: from, lte: to },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          consultation: {
            include: {
              patient: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.consultation.findMany({
        where: {
          doctorId,
          status: ConsultationStatus.completed,
          receipt: null,
        },
        orderBy: { closedAt: 'desc' },
        take: 30,
        include: {
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.doctor.findFirst({
        where: { id: doctorId },
        select: { consultationPrice: true, preferredCurrency: true },
      }),
    ]);

    const currency = doctor?.preferredCurrency ?? 'MAD';
    const defaultAmount = Number(doctor?.consultationPrice ?? 0);

    const items = receiptRows.map((row) => {
      const amount = Number(row.amount);
      const payload = parsePayload(row.payload);
      const status = effectiveStatus(amount, payload);
      const paid = paidValue(amount, payload, status);
      const u = row.consultation.patient.user;
      const patientDisplayName =
        [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || 'Patient';
      return {
        receiptId: row.id,
        consultationId: row.consultationId,
        reference: receiptReference(row.id),
        patientDisplayName,
        date: row.createdAt.toISOString(),
        amount,
        paidAmount: paid,
        currency: row.currency,
        paymentStatus: status,
        paymentMethod: payload.paymentMethod ?? null,
        paymentMethodLabel: paymentMethodLabel(payload.paymentMethod),
      };
    });

    const filtered =
      statusFilter === 'paid' || statusFilter === 'pending' || statusFilter === 'partial'
        ? items.filter((i) => i.paymentStatus === statusFilter)
        : items;

    const todayReceipts = receiptRows.filter(
      (r) => r.createdAt >= todayStart && r.createdAt <= todayEnd,
    );
    const yesterdayReceipts = await this.prisma.consultationReceipt.findMany({
      where: {
        consultation: { doctorId },
        createdAt: {
          gte: startOfDay(new Date(todayStart.getTime() - 86400000)),
          lte: endOfDay(new Date(todayStart.getTime() - 86400000)),
        },
      },
    });

    const sumPaid = (rows: { amount: unknown; payload: unknown }[]) =>
      rows.reduce((s, r) => {
        const amount = Number(r.amount);
        const p = parsePayload(r.payload);
        const st = effectiveStatus(amount, p);
        return s + paidValue(amount, p, st);
      }, 0);

    const todayRevenue = sumPaid(todayReceipts);
    const yesterdayRevenue = sumPaid(yesterdayReceipts);
    const todayChange =
      yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10
        : todayRevenue > 0
          ? 100
          : null;

    let unpaidTotal = 0;
    let unpaidCount = 0;
    for (const i of items) {
      const due = i.amount - i.paidAmount;
      if (due > 0.001) {
        unpaidTotal += due;
        unpaidCount += 1;
      }
    }
    for (const c of pendingConsultations) {
      unpaidTotal += defaultAmount;
      unpaidCount += 1;
    }

    const periodRevenue = items.reduce((s, i) => s + i.paidAmount, 0);

    const methodCounts = new Map<string, number>();
    for (const i of items) {
      if (i.paymentStatus !== 'paid' || !i.paymentMethod) continue;
      methodCounts.set(i.paymentMethod, (methodCounts.get(i.paymentMethod) ?? 0) + 1);
    }
    let preferredPaymentMethod: string | null = null;
    let max = 0;
    for (const [m, c] of methodCounts) {
      if (c > max) {
        max = c;
        preferredPaymentMethod = paymentMethodLabel(m as PaymentMethod);
      }
    }

    const prevReceipts = await this.prisma.consultationReceipt.findMany({
      where: {
        consultation: { doctorId },
        createdAt: { gte: prevFrom, lte: prevTo },
      },
    });
    const prevPeriodRevenue = sumPaid(prevReceipts);
    const periodRevenueChange =
      prevPeriodRevenue > 0
        ? Math.round(((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 1000) / 10
        : periodRevenue > 0
          ? 100
          : null;

    return {
      period,
      range: { from: from.toISOString(), to: to.toISOString() },
      currency,
      summary: {
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        todayRevenueChangePercent: todayChange,
        unpaidTotal: Math.round(unpaidTotal * 100) / 100,
        unpaidCount,
        receiptsInPeriod: items.length,
        periodRevenue: Math.round(periodRevenue * 100) / 100,
        periodRevenueChangePercent: periodRevenueChange,
        preferredPaymentMethod: preferredPaymentMethod ?? (items.length ? '—' : null),
      },
      items: filtered,
      pendingConsultations: pendingConsultations.map((c) => {
        const u = c.patient.user;
        const patientDisplayName =
          [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || 'Patient';
        return {
          consultationId: c.id,
          patientDisplayName,
          closedAt: c.closedAt?.toISOString() ?? c.updatedAt.toISOString(),
          suggestedAmount: defaultAmount,
          currency,
        };
      }),
    };
  }

  async updateReceiptPayment(
    user: SanitizedUser,
    receiptId: string,
    dto: UpdateReceiptPaymentDto,
  ) {
    const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
    const row = await this.prisma.consultationReceipt.findFirst({
      where: {
        id: receiptId,
        consultation: { doctorId },
      },
      include: { consultation: true },
    });
    if (!row) throw new NotFoundException('Reçu introuvable');

    const amount = Number(row.amount);
    const prev = parsePayload(row.payload);
    let paidAmount = dto.paidAmount;
    if (dto.paymentStatus === 'paid') {
      paidAmount = amount;
    } else if (dto.paymentStatus === 'pending') {
      paidAmount = 0;
    } else if (dto.paymentStatus === 'partial' && paidAmount == null) {
      paidAmount = prev.paidAmount ?? amount / 2;
    }

    const payload: ReceiptPayload = {
      ...prev,
      paymentStatus: dto.paymentStatus,
      paymentMethod: dto.paymentMethod ?? prev.paymentMethod,
      paidAmount: paidAmount ?? prev.paidAmount,
    };

    const updated = await this.prisma.consultationReceipt.update({
      where: { id: receiptId },
      data: { payload: payload as Prisma.InputJsonValue },
    });

    return {
      receiptId: updated.id,
      paymentStatus: dto.paymentStatus,
      paymentMethod: payload.paymentMethod ?? null,
      paidAmount: paidValue(amount, payload, dto.paymentStatus),
    };
  }

  async createReceipt(user: SanitizedUser, dto: CreateBillingReceiptDto) {
    const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
    const c = await this.prisma.consultation.findFirst({
      where: { id: dto.consultationId, doctorId },
      include: { receipt: true },
    });
    if (!c) throw new NotFoundException('Consultation introuvable');
    if (c.status !== ConsultationStatus.completed) {
      throw new BadRequestException('La consultation doit être clôturée avant facturation');
    }
    if (c.receipt) throw new BadRequestException('Un reçu existe déjà pour cette consultation');

    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId },
      select: { consultationPrice: true, preferredCurrency: true },
    });
    const amount = dto.amount ?? Number(doctor?.consultationPrice ?? 0);
    const currency = doctor?.preferredCurrency ?? 'MAD';
    const status: PaymentStatus = dto.paymentStatus ?? 'pending';
    const paidAmount =
      status === 'paid' ? amount : status === 'partial' ? amount / 2 : 0;

    const closedAt = c.closedAt ?? new Date();
    const row = await this.prisma.consultationReceipt.create({
      data: {
        consultationId: c.id,
        amount,
        currency,
        payload: {
          patientId: c.patientId,
          doctorId: c.doctorId,
          specialtyCode: c.specialtyCode,
          closedAt: closedAt.toISOString(),
          paymentStatus: status,
          paymentMethod: dto.paymentMethod,
          paidAmount,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      receiptId: row.id,
      reference: receiptReference(row.id),
      amount,
      currency,
      paymentStatus: status,
    };
  }
}
