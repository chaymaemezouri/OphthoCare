export type DoctorAnalyticsPeriod = 'week' | 'month' | 'quarter';

export type DoctorAnalyticsKpi = {
  value: number;
  changePercent: number | null;
};

export type DoctorAnalyticsResponse = {
  period: DoctorAnalyticsPeriod;
  range: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  summary: {
    consultations: DoctorAnalyticsKpi;
    newPatients: DoctorAnalyticsKpi;
    revenue: DoctorAnalyticsKpi & { currency: string };
    retentionRate: DoctorAnalyticsKpi;
    completedAppointments: { value: number; total: number };
  };
  attendanceSeries: {
    date: string;
    label: string;
    appointments: number;
    completed: number;
  }[];
  diagnosisBreakdown: { label: string; count: number; percent: number }[];
  activityByType: {
    key: string;
    label: string;
    volume: number;
    revenue: number;
    completionRate: number;
  }[];
  consultationDuration: {
    byAppointmentKind: {
      label: string;
      count: number;
      avgSeconds: number;
      avgMinutes: number;
    }[];
    bySpecialty: {
      label: string;
      count: number;
      avgSeconds: number;
      avgMinutes: number;
    }[];
  };
};
