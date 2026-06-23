import { Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  AppointmentType,
  AppointmentVisitKind,
  ConsultationStatus,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { SanitizedUser } from '@/modules/users/users.service';
import { DoctorsService } from './doctors.service';

export type AnalyticsPeriod = 'week' | 'month' | 'quarter';

type PeriodRange = {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
};

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

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

function resolvePeriod(period: string, now = new Date()): PeriodRange {
  const p = period === 'week' || period === 'quarter' ? period : 'month';
  const to = endOfDay(now);

  if (p === 'week') {
    const from = startOfDay(now);
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
    const prevTo = endOfDay(new Date(from.getTime() - 86400000));
    const prevFrom = startOfDay(new Date(prevTo));
    prevFrom.setDate(prevFrom.getDate() - 6);
    return { from, to, prevFrom, prevTo };
  }

  if (p === 'quarter') {
    const from = startOfDay(now);
    from.setMonth(from.getMonth() - 2, 1);
    const spanMs = to.getTime() - from.getTime();
    const prevTo = endOfDay(new Date(from.getTime() - 86400000));
    const prevFrom = startOfDay(new Date(prevTo.getTime() - spanMs));
    return { from, to, prevFrom, prevTo };
  }

  const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const prevTo = endOfDay(new Date(from.getTime() - 86400000));
  const prevFrom = startOfDay(new Date(prevTo.getFullYear(), prevTo.getMonth(), 1));
  return { from, to, prevFrom, prevTo };
}

function visitKindLabel(kind: AppointmentVisitKind): string {
  switch (kind) {
    case AppointmentVisitKind.followup:
      return 'Suivi';
    case AppointmentVisitKind.emergency:
      return 'Urgence';
    case AppointmentVisitKind.teleconsult:
      return 'Téléconsultation';
    default:
      return 'Première visite';
  }
}

function appointmentTypeLabel(type: AppointmentType): string {
  return type === AppointmentType.video ? 'Visio' : 'Cabinet';
}

@Injectable()
export class DoctorAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorsService: DoctorsService,
  ) {}

  async getMeAnalytics(user: SanitizedUser, periodRaw?: string) {
    const period: AnalyticsPeriod =
      periodRaw === 'week' || periodRaw === 'quarter' ? periodRaw : 'month';
    const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
    const range = resolvePeriod(period);

    const [
      consultationsCurrent,
      consultationsPrevious,
      revenueCurrent,
      revenuePrevious,
      appointmentsCurrent,
      appointmentsPrevious,
      newPatientsCurrent,
      newPatientsPrevious,
      returningCurrent,
      diagnosisRows,
      receiptByAppointment,
      consultationDuration,
    ] = await Promise.all([
      this.countCompletedConsultations(doctorId, range.from, range.to),
      this.countCompletedConsultations(doctorId, range.prevFrom, range.prevTo),
      this.sumRevenue(doctorId, range.from, range.to),
      this.sumRevenue(doctorId, range.prevFrom, range.prevTo),
      this.listAppointments(doctorId, range.from, range.to),
      this.listAppointments(doctorId, range.prevFrom, range.prevTo),
      this.countNewPatients(doctorId, range.from, range.to),
      this.countNewPatients(doctorId, range.prevFrom, range.prevTo),
      this.countReturningPatients(doctorId, range.from, range.to),
      this.diagnosisGroups(doctorId, range.from, range.to),
      this.revenueByAppointmentType(doctorId, range.from, range.to),
      this.consultationDurationByType(doctorId, range.from, range.to),
    ]);

    const uniquePatientsCurrent = new Set(appointmentsCurrent.map((a) => a.patientId)).size;
    const retentionRate =
      uniquePatientsCurrent > 0
        ? Math.round((returningCurrent / uniquePatientsCurrent) * 1000) / 10
        : 0;

    const prevUnique = new Set(appointmentsPrevious.map((a) => a.patientId)).size;
    const prevReturning = await this.countReturningPatients(
      doctorId,
      range.prevFrom,
      range.prevTo,
    );
    const prevRetention =
      prevUnique > 0 ? Math.round((prevReturning / prevUnique) * 1000) / 10 : 0;

    const attendanceSeries = this.buildAttendanceSeries(
      period,
      range.from,
      range.to,
      appointmentsCurrent,
    );

    const diagnosisBreakdown = this.formatDiagnosisBreakdown(diagnosisRows);
    const activityByType = this.buildActivityByType(appointmentsCurrent, receiptByAppointment);

    const currency =
      (await this.prisma.consultationReceipt.findFirst({
        where: { consultation: { doctorId } },
        select: { currency: true },
      }))?.currency ?? 'MAD';

    return {
      period,
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        previousFrom: range.prevFrom.toISOString(),
        previousTo: range.prevTo.toISOString(),
      },
      summary: {
        consultations: {
          value: consultationsCurrent,
          changePercent: percentChange(consultationsCurrent, consultationsPrevious),
        },
        newPatients: {
          value: newPatientsCurrent,
          changePercent: percentChange(newPatientsCurrent, newPatientsPrevious),
        },
        revenue: {
          value: Math.round(revenueCurrent * 100) / 100,
          currency,
          changePercent: percentChange(revenueCurrent, revenuePrevious),
        },
        retentionRate: {
          value: retentionRate,
          changePercent:
            prevRetention > 0 || retentionRate > 0
              ? Math.round((retentionRate - prevRetention) * 10) / 10
              : null,
        },
        completedAppointments: {
          value: appointmentsCurrent.filter((a) => a.status === AppointmentStatus.completed)
            .length,
          total: appointmentsCurrent.length,
        },
      },
      attendanceSeries,
      diagnosisBreakdown,
      activityByType,
      consultationDuration,
    };
  }

  private async consultationDurationByType(doctorId: string, from: Date, to: Date) {
    const rows = await this.prisma.consultation.findMany({
      where: {
        doctorId,
        status: ConsultationStatus.completed,
        durationSeconds: { not: null },
        closedAt: { gte: from, lte: to },
      },
      select: {
        durationSeconds: true,
        specialtyCode: true,
        appointment: { select: { type: true, visitKind: true } },
      },
    });

    const bucket = (
      map: Map<string, { label: string; totalSeconds: number; count: number }>,
      key: string,
      label: string,
      seconds: number,
    ) => {
      const prev = map.get(key);
      if (prev) {
        prev.totalSeconds += seconds;
        prev.count += 1;
      } else {
        map.set(key, { label, totalSeconds: seconds, count: 1 });
      }
    };

    const byVisit = new Map<string, { label: string; totalSeconds: number; count: number }>();
    const bySpecialty = new Map<string, { label: string; totalSeconds: number; count: number }>();

    for (const r of rows) {
      const sec = r.durationSeconds ?? 0;
      if (r.appointment) {
        const label = `${appointmentTypeLabel(r.appointment.type)} · ${visitKindLabel(r.appointment.visitKind)}`;
        bucket(byVisit, `${r.appointment.type}_${r.appointment.visitKind}`, label, sec);
      } else {
        bucket(byVisit, 'no_appointment', 'Sans rendez-vous lié', sec);
      }
      bucket(bySpecialty, r.specialtyCode, r.specialtyCode, sec);
    }

    const toSeries = (map: Map<string, { label: string; totalSeconds: number; count: number }>) =>
      [...map.values()]
        .map((v) => ({
          label: v.label,
          count: v.count,
          avgSeconds: v.count > 0 ? Math.round(v.totalSeconds / v.count) : 0,
          avgMinutes: v.count > 0 ? Math.round((v.totalSeconds / v.count / 60) * 10) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);

    return {
      byAppointmentKind: toSeries(byVisit),
      bySpecialty: toSeries(bySpecialty),
    };
  }

  private async countCompletedConsultations(doctorId: string, from: Date, to: Date) {
    return this.prisma.consultation.count({
      where: {
        doctorId,
        status: ConsultationStatus.completed,
        OR: [
          { closedAt: { gte: from, lte: to } },
          { closedAt: null, updatedAt: { gte: from, lte: to } },
        ],
      },
    });
  }

  private async sumRevenue(doctorId: string, from: Date, to: Date) {
    const agg = await this.prisma.consultationReceipt.aggregate({
      where: {
        consultation: {
          doctorId,
          status: ConsultationStatus.completed,
          OR: [
            { closedAt: { gte: from, lte: to } },
            { closedAt: null, updatedAt: { gte: from, lte: to } },
          ],
        },
      },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  }

  private async listAppointments(doctorId: string, from: Date, to: Date) {
    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        startTime: { gte: from, lte: to },
        status: { not: AppointmentStatus.cancelled },
      },
      select: {
        id: true,
        patientId: true,
        startTime: true,
        status: true,
        type: true,
        visitKind: true,
      },
    });
  }

  private async countNewPatients(doctorId: string, from: Date, to: Date) {
    const inPeriod = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        startTime: { gte: from, lte: to },
        status: { in: [AppointmentStatus.completed, AppointmentStatus.confirmed, AppointmentStatus.in_progress] },
      },
      select: { patientId: true },
      distinct: ['patientId'],
    });
    if (inPeriod.length === 0) return 0;
    const ids = inPeriod.map((r) => r.patientId);
    const prior = await this.prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        doctorId,
        deletedAt: null,
        patientId: { in: ids },
        startTime: { lt: from },
      },
    });
    const priorSet = new Set(prior.map((p) => p.patientId));
    return ids.filter((id) => !priorSet.has(id)).length;
  }

  private async countReturningPatients(doctorId: string, from: Date, to: Date) {
    const inPeriod = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        startTime: { gte: from, lte: to },
        status: { not: AppointmentStatus.cancelled },
      },
      select: { patientId: true },
      distinct: ['patientId'],
    });
    if (inPeriod.length === 0) return 0;
    const ids = inPeriod.map((r) => r.patientId);
    const prior = await this.prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        doctorId,
        deletedAt: null,
        patientId: { in: ids },
        startTime: { lt: from },
      },
    });
    return prior.length;
  }

  private async diagnosisGroups(doctorId: string, from: Date, to: Date) {
    const rows = await this.prisma.consultation.findMany({
      where: {
        doctorId,
        status: ConsultationStatus.completed,
        diagnosis: { not: null },
        OR: [
          { closedAt: { gte: from, lte: to } },
          { closedAt: null, updatedAt: { gte: from, lte: to } },
        ],
      },
      select: { diagnosis: true },
    });
    const map = new Map<string, { label: string; count: number }>();
    for (const r of rows) {
      const raw = r.diagnosis?.trim();
      if (!raw) continue;
      const label = raw.split(/[;\n]/)[0]?.trim().slice(0, 80) || raw.slice(0, 80);
      const key = label.toLowerCase();
      const prev = map.get(key);
      map.set(key, { label, count: (prev?.count ?? 0) + 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }

  private formatDiagnosisBreakdown(
    rows: { label: string; count: number }[],
  ): { label: string; count: number; percent: number }[] {
    const total = rows.reduce((s, r) => s + r.count, 0);
    if (total === 0) return [];
    return rows.map((r) => ({
      label: r.label,
      count: r.count,
      percent: Math.round((r.count / total) * 1000) / 10,
    }));
  }

  private async revenueByAppointmentType(doctorId: string, from: Date, to: Date) {
    const rows = await this.prisma.consultation.findMany({
      where: {
        doctorId,
        status: ConsultationStatus.completed,
        appointmentId: { not: null },
        OR: [
          { closedAt: { gte: from, lte: to } },
          { closedAt: null, updatedAt: { gte: from, lte: to } },
        ],
      },
      select: {
        appointment: { select: { type: true, visitKind: true } },
        receipt: { select: { amount: true } },
      },
    });
    const map = new Map<string, number>();
    for (const r of rows) {
      if (!r.appointment) continue;
      const key = `${r.appointment.type}_${r.appointment.visitKind}`;
      const amt = Number(r.receipt?.amount ?? 0);
      map.set(key, (map.get(key) ?? 0) + amt);
    }
    return map;
  }

  private buildAttendanceSeries(
    period: AnalyticsPeriod,
    from: Date,
    to: Date,
    appointments: { startTime: Date; status: AppointmentStatus }[],
  ) {
    const buckets = new Map<string, { label: string; appointments: number; completed: number }>();
    const cur = startOfDay(from);
    const end = endOfDay(to);

    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      const label =
        period === 'week'
          ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][
              (cur.getDay() + 6) % 7
            ]
          : `${cur.getDate()}/${cur.getMonth() + 1}`;
      buckets.set(key, { label, appointments: 0, completed: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    for (const a of appointments) {
      const key = startOfDay(a.startTime).toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (!b) continue;
      b.appointments += 1;
      if (a.status === AppointmentStatus.completed) b.completed += 1;
    }

    return [...buckets.entries()].map(([date, v]) => ({
      date,
      label: v.label,
      appointments: v.appointments,
      completed: v.completed,
    }));
  }

  private buildActivityByType(
    appointments: {
      type: AppointmentType;
      visitKind: AppointmentVisitKind;
      status: AppointmentStatus;
    }[],
    revenueMap: Map<string, number>,
  ) {
    const groups = new Map<
      string,
      { type: AppointmentType; visitKind: AppointmentVisitKind; total: number; completed: number }
    >();

    for (const a of appointments) {
      const key = `${a.type}_${a.visitKind}`;
      const g = groups.get(key) ?? {
        type: a.type,
        visitKind: a.visitKind,
        total: 0,
        completed: 0,
      };
      g.total += 1;
      if (a.status === AppointmentStatus.completed) g.completed += 1;
      groups.set(key, g);
    }

    return [...groups.entries()]
      .map(([key, g]) => {
        const revenue = revenueMap.get(key) ?? 0;
        const efficiency = g.total > 0 ? Math.round((g.completed / g.total) * 1000) / 10 : 0;
        return {
          key,
          label: `${appointmentTypeLabel(g.type)} — ${visitKindLabel(g.visitKind)}`,
          volume: g.total,
          revenue: Math.round(revenue * 100) / 100,
          completionRate: efficiency,
        };
      })
      .sort((a, b) => b.volume - a.volume);
  }
}
