import apiClient from './client';

export type TraineeSessionType = 'chat' | 'quiz' | 'exam_explanation';

export type TraineeLearningSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: TraineeSessionType;
  status: 'in_progress' | 'completed';
  title: string | null;
  topic: string | null;
  patientId: string | null;
  scorePercent: number | null;
  completedAt: string | null;
};

export type TraineeProgress = {
  totalSessions: number;
  completedSessions: number;
  chatSessions: number;
  quizSessions: number;
  examSessions: number;
  averageQuizScorePercent: number | null;
  disclaimer: string;
};

export type TraineeQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type TraineeMedicalImage = {
  id: string;
  createdAt: string;
  examType: string | null;
  title: string | null;
  fileUrl: string;
  mimeType: string | null;
  notes: string | null;
  aiAnalysis: unknown;
  hasPedagogicalExplanation: boolean;
};

export const traineeLearningApi = {
  aiChat(body: {
    messages: { role: 'user' | 'assistant'; content: string }[];
    patientId?: string;
    sessionId?: string;
  }) {
    return apiClient.post<{
      sessionId: string;
      provider: string;
      reply: string;
      disclaimer: string;
    }>('/trainee-learning/ai/chat', body).then((r) => r.data);
  },

  generateQuiz(body: { topic: string; patientId?: string; questionCount?: number }) {
    return apiClient
      .post<{
        sessionId: string;
        topic: string;
        questions: TraineeQuizQuestion[];
        disclaimer: string;
      }>('/trainee-learning/quiz/generate', body)
      .then((r) => r.data);
  },

  submitQuiz(sessionId: string, answers: Record<string, number>) {
    return apiClient
      .post<{
        sessionId: string;
        scorePercent: number;
        correct: number;
        total: number;
        results: {
          id: string;
          correct: boolean;
          chosenIndex: number;
          correctIndex: number;
          explanation: string;
        }[];
        disclaimer: string;
      }>(`/trainee-learning/quiz/${sessionId}/submit`, { answers })
      .then((r) => r.data);
  },

  listSessions(params?: { type?: TraineeSessionType; skip?: number; take?: number }) {
    return apiClient
      .get<{ items: TraineeLearningSession[]; total: number; skip: number; take: number }>(
        '/trainee-learning/sessions',
        { params },
      )
      .then((r) => r.data);
  },

  getProgress() {
    return apiClient.get<TraineeProgress>('/trainee-learning/progress').then((r) => r.data);
  },

  listMedicalImages(patientId: string) {
    return apiClient
      .get<{ items: TraineeMedicalImage[]; disclaimer: string }>(
        `/trainee-learning/medical-images/patient/${patientId}`,
      )
      .then((r) => r.data);
  },

  explainMedicalImage(imageId: string) {
    return apiClient
      .post<{
        imageId: string;
        summary: string;
        provider: string;
        sessionId: string | null;
        disclaimer: string;
      }>(`/trainee-learning/medical-images/${imageId}/explain`)
      .then((r) => r.data);
  },
};
