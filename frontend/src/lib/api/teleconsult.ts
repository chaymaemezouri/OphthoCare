import apiClient from "./client";

export type TeleconsultAppointmentRow = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
  patientId: string;
  patientDisplayName: string;
  hasActiveRoom: boolean;
};

export type TeleconsultChatMessage = {
  id: string;
  senderRole: "doctor" | "patient";
  senderName: string;
  body: string;
  createdAt: string;
};

export type TeleconsultSignal = {
  seq: number;
  from: "doctor" | "patient";
  type: "offer" | "answer" | "ice" | "hangup";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type TeleconsultContext = {
  appointment: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    reason?: string;
    notes?: string;
  };
  patient: {
    id: string;
    displayName: string;
    dateOfBirth: string | null;
    age: number | null;
    allergies: string[];
    antecedents: string[];
  };
  room: { startedAt: string; endedAt: string | null; chatCount: number } | null;
  myRole: "doctor" | "patient";
};

export const teleconsultApi = {
  listAppointments: async (date?: string) => {
    const response = await apiClient.get("/teleconsult/appointments", { params: { date } });
    return response.data as TeleconsultAppointmentRow[];
  },

  getContext: async (appointmentId: string) => {
    const response = await apiClient.get(`/teleconsult/${encodeURIComponent(appointmentId)}/context`);
    return response.data as TeleconsultContext;
  },

  join: async (appointmentId: string) => {
    const response = await apiClient.post(`/teleconsult/${encodeURIComponent(appointmentId)}/join`);
    return response.data as {
      appointmentId: string;
      role: "doctor" | "patient";
      startedAt: string;
      chat: TeleconsultChatMessage[];
      signalCursor: number;
    };
  },

  listChat: async (appointmentId: string, after?: string) => {
    const response = await apiClient.get(`/teleconsult/${encodeURIComponent(appointmentId)}/chat`, {
      params: after ? { after } : undefined,
    });
    return response.data as { messages: TeleconsultChatMessage[] };
  },

  sendChat: async (appointmentId: string, body: string) => {
    const response = await apiClient.post(`/teleconsult/${encodeURIComponent(appointmentId)}/chat`, {
      body,
    });
    return response.data as TeleconsultChatMessage;
  },

  pollSignals: async (appointmentId: string, afterSeq: number) => {
    const response = await apiClient.get(`/teleconsult/${encodeURIComponent(appointmentId)}/signals`, {
      params: { afterSeq },
    });
    return response.data as { signals: TeleconsultSignal[]; ended: boolean };
  },

  postSignal: async (
    appointmentId: string,
    type: TeleconsultSignal["type"],
    payload: Record<string, unknown>,
  ) => {
    const response = await apiClient.post(`/teleconsult/${encodeURIComponent(appointmentId)}/signals`, {
      type,
      payload,
    });
    return response.data as { seq: number };
  },

  end: async (appointmentId: string, notes?: string) => {
    const response = await apiClient.post(`/teleconsult/${encodeURIComponent(appointmentId)}/end`, {
      notes,
    });
    return response.data as { ended: boolean; appointmentId: string };
  },
};
