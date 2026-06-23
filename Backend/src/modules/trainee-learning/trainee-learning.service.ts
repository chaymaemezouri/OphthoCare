import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TraineeSessionStatus, TraineeSessionType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { TraineeLearningContextService } from './trainee-learning-context.service';
import { TraineeAiChatDto } from './dto/trainee-ai-chat.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

const PEDAGOGICAL_DISCLAIMER =
  'Contenu à visée pédagogique uniquement. Ne constitue pas un avis médical ni un diagnostic. ' +
  'Toute décision clinique relève du médecin responsable.';

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

@Injectable()
export class TraineeLearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TraineeLearningContextService,
  ) {}

  async aiChat(user: RequestUser, dto: TraineeAiChatDto) {
    const { userId, doctorSpaceId } = await this.ctx.requireTrainee(user);
    if (dto.patientId) await this.ctx.assertPatientAccess(user, dto.patientId);

    let patientContext = '';
    if (dto.patientId) {
      const p = await this.prisma.patient.findFirst({
        where: { id: dto.patientId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          consultations: {
            orderBy: { createdAt: 'desc' },
            take: 2,
            select: { specialtyCode: true, diagnosis: true, observations: true },
          },
        },
      });
      if (p) {
        const name = [p.user?.firstName, p.user?.lastName].filter(Boolean).join(' ');
        patientContext = `Cas observé (données anonymisées pour l'apprentissage) : ${name}. Éléments : ${JSON.stringify(p.consultations)}`;
      }
    }

    const systemPrompt =
      'Tu es un tuteur IA pour stagiaires en ophtalmologie et médecine générale. ' +
      'Objectif : enseigner les concepts, raisonnements différentiels et protocoles. ' +
      'Ne pose jamais de diagnostic définitif sur un patient réel. ' +
      'Rappelle les limites de l\'IA et l\'importance de la supervision du médecin. ' +
      'Réponds en français, de façon structurée et pédagogique.' +
      (patientContext ? `\n${patientContext}` : '');

    const lastUser = [...dto.messages].reverse().find((m) => m.role === 'user');
    const reply = await this.callOpenAiText(systemPrompt, dto.messages, lastUser?.content ?? '');

    let sessionId = dto.sessionId;
    const allMessages = [
      ...dto.messages,
      { role: 'assistant' as const, content: reply.text },
    ];

    if (sessionId) {
      await this.ctx.assertSessionOwnership(user, sessionId);
      await this.prisma.traineeLearningSession.update({
        where: { id: sessionId },
        data: { messages: allMessages as unknown as Prisma.InputJsonValue },
      });
    } else {
      const title =
        lastUser?.content?.slice(0, 80) || 'Conversation IA';
      const created = await this.prisma.traineeLearningSession.create({
        data: {
          userId,
          doctorSpaceId,
          type: TraineeSessionType.chat,
          title,
          patientId: dto.patientId ?? null,
          messages: allMessages as unknown as Prisma.InputJsonValue,
          metadata: { provider: reply.provider },
        },
      });
      sessionId = created.id;
    }

    return {
      sessionId,
      provider: reply.provider,
      reply: reply.text,
      disclaimer: PEDAGOGICAL_DISCLAIMER + (reply.disclaimerExtra ? ` ${reply.disclaimerExtra}` : ''),
    };
  }

  async generateQuiz(user: RequestUser, dto: GenerateQuizDto) {
    const { userId, doctorSpaceId } = await this.ctx.requireTrainee(user);
    if (dto.patientId) await this.ctx.assertPatientAccess(user, dto.patientId);

    const count = dto.questionCount ?? 5;
    const questions = await this.buildQuizQuestions(dto.topic, count, dto.patientId);

    const session = await this.prisma.traineeLearningSession.create({
      data: {
        userId,
        doctorSpaceId,
        type: TraineeSessionType.quiz,
        status: TraineeSessionStatus.in_progress,
        title: `Quiz : ${dto.topic.slice(0, 60)}`,
        topic: dto.topic,
        patientId: dto.patientId ?? null,
        quizData: { questions } as unknown as Prisma.InputJsonValue,
        metadata: { questionCount: questions.length },
      },
    });

    const publicQuestions = questions.map(({ correctIndex, explanation, ...q }) => q);

    return {
      sessionId: session.id,
      topic: dto.topic,
      questions: publicQuestions,
      disclaimer: PEDAGOGICAL_DISCLAIMER,
    };
  }

  async submitQuiz(user: RequestUser, sessionId: string, dto: SubmitQuizDto) {
    const { session } = await this.ctx.assertSessionOwnership(user, sessionId);
    if (session.type !== TraineeSessionType.quiz) {
      throw new NotFoundException('Session quiz introuvable');
    }

    const raw = session.quizData as { questions?: QuizQuestion[] } | null;
    const questions = raw?.questions ?? [];
    if (questions.length === 0) throw new NotFoundException('Quiz vide');

    let correct = 0;
    const results = questions.map((q) => {
      const chosen = dto.answers[q.id];
      const ok = chosen === q.correctIndex;
      if (ok) correct += 1;
      return {
        id: q.id,
        correct: ok,
        chosenIndex: chosen,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      };
    });

    const scorePercent = Math.round((correct / questions.length) * 100);

    await this.prisma.traineeLearningSession.update({
      where: { id: sessionId },
      data: {
        status: TraineeSessionStatus.completed,
        userAnswers: dto.answers as unknown as Prisma.InputJsonValue,
        scorePercent,
        completedAt: new Date(),
        metadata: {
          ...(typeof session.metadata === 'object' && session.metadata ? session.metadata : {}),
          results,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      sessionId,
      scorePercent,
      correct,
      total: questions.length,
      results,
      disclaimer: PEDAGOGICAL_DISCLAIMER,
    };
  }

  async listSessions(user: RequestUser, opts: { type?: TraineeSessionType; skip?: number; take?: number }) {
    const { userId, doctorSpaceId } = await this.ctx.requireTrainee(user);
    const skip = Math.max(0, opts.skip ?? 0);
    const take = Math.min(Math.max(1, opts.take ?? 20), 50);
    const where: Prisma.TraineeLearningSessionWhereInput = {
      userId,
      doctorSpaceId,
      ...(opts.type ? { type: opts.type } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.traineeLearningSession.count({ where }),
      this.prisma.traineeLearningSession.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          type: true,
          status: true,
          title: true,
          topic: true,
          patientId: true,
          scorePercent: true,
          completedAt: true,
        },
      }),
    ]);

    return {
      items: items.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        completedAt: s.completedAt?.toISOString() ?? null,
      })),
      total,
      skip,
      take,
    };
  }

  async getProgress(user: RequestUser) {
    const { userId, doctorSpaceId } = await this.ctx.requireTrainee(user);
    const sessions = await this.prisma.traineeLearningSession.findMany({
      where: { userId, doctorSpaceId },
      select: { type: true, status: true, scorePercent: true },
    });

    const byType = (t: TraineeSessionType) => sessions.filter((s) => s.type === t);
    const completed = sessions.filter((s) => s.status === TraineeSessionStatus.completed);
    const quizScores = completed
      .filter((s) => s.type === TraineeSessionType.quiz && s.scorePercent != null)
      .map((s) => s.scorePercent as number);
    const avgQuiz =
      quizScores.length > 0
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
        : null;

    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      chatSessions: byType(TraineeSessionType.chat).length,
      quizSessions: byType(TraineeSessionType.quiz).length,
      examSessions: byType(TraineeSessionType.exam_explanation).length,
      averageQuizScorePercent: avgQuiz,
      disclaimer: PEDAGOGICAL_DISCLAIMER,
    };
  }

  async listMedicalImages(user: RequestUser, patientId: string) {
    const { doctorSpaceId } = await this.ctx.requireTrainee(user);
    await this.ctx.assertPatientAccess(user, patientId);
    const rows = await this.prisma.patientMedicalImage.findMany({
      where: { patientId, doctorSpaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        examType: true,
        title: true,
        fileUrl: true,
        mimeType: true,
        notes: true,
        aiAnalysis: true,
      },
    });
    return {
      items: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        hasPedagogicalExplanation: Boolean(
          (r.aiAnalysis as { pedagogicalSummary?: string } | null)?.pedagogicalSummary,
        ),
      })),
      disclaimer: PEDAGOGICAL_DISCLAIMER,
    };
  }

  async explainMedicalImage(user: RequestUser, imageId: string) {
    const { userId, doctorSpaceId } = await this.ctx.requireTrainee(user);
    const row = await this.prisma.patientMedicalImage.findFirst({
      where: { id: imageId, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Image introuvable');
    await this.ctx.assertPatientAccess(user, row.patientId);

    const existing = row.aiAnalysis as { pedagogicalSummary?: string } | null;
    if (existing?.pedagogicalSummary) {
      return {
        imageId: row.id,
        summary: existing.pedagogicalSummary,
        provider: 'cached',
        sessionId: null,
        disclaimer: PEDAGOGICAL_DISCLAIMER,
      };
    }

    const examLabel = row.examType || row.title || 'Examen';
    let summary: string;
    let provider = 'local';

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (apiKey && row.mimeType?.startsWith('image/')) {
      try {
        const baseUrl = process.env.API_URL || 'http://localhost:3001';
        const imageUrl = row.fileUrl.startsWith('http') ? row.fileUrl : `${baseUrl}${row.fileUrl}`;
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text:
                      `Tu formes un stagiaire en ophtalmologie sur un ${examLabel}. ` +
                      'Décris les structures visibles, les signes à rechercher, le raisonnement pédagogique. ' +
                      'Pas de diagnostic définitif. Sections : Observations, Points clés, Pièges fréquents, Pour aller plus loin.',
                  },
                  { type: 'image_url', image_url: { url: imageUrl } },
                ],
              },
            ],
            max_tokens: 900,
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          summary = json.choices?.[0]?.message?.content?.trim() ?? '';
          provider = 'openai';
        } else {
          summary = this.localExamExplanation(examLabel, row.notes);
        }
      } catch {
        summary = this.localExamExplanation(examLabel, row.notes);
      }
    } else {
      summary = this.localExamExplanation(examLabel, row.notes);
    }

    const analysis = {
      ...(existing && typeof existing === 'object' ? existing : {}),
      pedagogicalSummary: summary,
      pedagogicalAt: new Date().toISOString(),
      pedagogicalProvider: provider,
    };

    await this.prisma.patientMedicalImage.update({
      where: { id: row.id },
      data: { aiAnalysis: analysis as Prisma.InputJsonValue },
    });

    const session = await this.prisma.traineeLearningSession.create({
      data: {
        userId,
        doctorSpaceId,
        type: TraineeSessionType.exam_explanation,
        status: TraineeSessionStatus.completed,
        title: `Explication : ${examLabel}`,
        patientId: row.patientId,
        completedAt: new Date(),
        metadata: {
          imageId: row.id,
          examType: row.examType,
          provider,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      imageId: row.id,
      summary,
      provider,
      sessionId: session.id,
      disclaimer: PEDAGOGICAL_DISCLAIMER,
    };
  }

  private async buildQuizQuestions(
    topic: string,
    count: number,
    patientId?: string,
  ): Promise<QuizQuestion[]> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (apiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'Génère un quiz QCM pour stagiaires en ophtalmologie. Réponds UNIQUEMENT en JSON valide : ' +
                  '{"questions":[{"id":"q1","prompt":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]} ' +
                  `Exactement ${count} questions sur le thème demandé.`,
              },
              {
                role: 'user',
                content: `Thème : ${topic}${patientId ? ' (contexte clinique général, sans données identifiantes)' : ''}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 2500,
          }),
          signal: AbortSignal.timeout(45_000),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const raw = json.choices?.[0]?.message?.content?.trim() ?? '';
          const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '')) as {
            questions?: QuizQuestion[];
          };
          if (parsed.questions?.length) {
            return parsed.questions.slice(0, count).map((q, i) => ({
              id: q.id || `q${i + 1}`,
              prompt: q.prompt,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation || '',
            }));
          }
        }
      } catch {
        /* fallback */
      }
    }
    return this.localQuizQuestions(topic, count);
  }

  private localQuizQuestions(topic: string, count: number): QuizQuestion[] {
    const bank: QuizQuestion[] = [
      {
        id: 'q1',
        prompt: `Concernant « ${topic} », quelle affirmation est la plus exacte ?`,
        options: [
          'L’examen doit toujours commencer par la réfraction',
          'La PIO fait partie de l’évaluation de base en ophtalmologie',
          'L’OCT remplace systématiquement le fond d’œil',
          'Les corps flottants isolés imposent toujours une chirurgie urgente',
        ],
        correctIndex: 1,
        explanation: 'La PIO est un paramètre fondamental, notamment dans le bilan glaucome.',
      },
      {
        id: 'q2',
        prompt: 'Quel signe oriente vers une urgence rétinienne ?',
        options: [
          'Légère sécheresse oculaire',
          'Flashs lumineux et voile noir récent',
          'Hyperémie conjonctivale isolée',
          'Presbytie stable',
        ],
        correctIndex: 1,
        explanation: 'Flashs + voile = suspicion de décollement de rétine → avis urgent.',
      },
      {
        id: 'q3',
        prompt: 'À propos du champ visuel :',
        options: [
          'Il n’est utile que en pédiatrie',
          'Il complète le bilan glaucomateux',
          'Il remplace la biomicroscopie',
          'Il est contre-indiqué si PIO normale',
        ],
        correctIndex: 1,
        explanation: 'Le CV est central dans le suivi et le diagnostic du glaucome.',
      },
    ];
    return bank.slice(0, Math.min(count, bank.length));
  }

  private localExamExplanation(examType: string, notes: string | null): string {
    return (
      `**Explication pédagogique (${examType})**\n\n` +
      '**Observations** : Décrivez systématiquement les structures anatomiques attendues pour ce type d\'examen.\n\n' +
      '**Points clés** : Corrélez avec la clinique et les antécédents du patient (supervision médecin requise).\n\n' +
      '**Pièges fréquents** : Artefacts, mauvaise centration, confusion normale/pathologique.\n\n' +
      (notes ? `**Notes du dossier** : ${notes}\n\n` : '') +
      '_Configurez OPENAI_API_KEY pour une analyse visuelle détaillée._'
    );
  }

  private async callOpenAiText(
    systemPrompt: string,
    messages: { role: string; content: string }[],
    fallbackQuestion: string,
  ): Promise<{ text: string; provider: string; disclaimerExtra?: string }> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return {
        provider: 'local',
        text: this.localChatReply(fallbackQuestion),
        disclaimerExtra: 'OPENAI_API_KEY non configuré — réponse indicative locale.',
      };
    }
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.5,
          max_tokens: 1200,
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return {
        provider: 'openai',
        text: json.choices?.[0]?.message?.content?.trim() ?? 'Réponse vide.',
      };
    } catch (e) {
      return {
        provider: 'local',
        text: this.localChatReply(fallbackQuestion),
        disclaimerExtra: `OpenAI indisponible (${(e as Error).message}).`,
      };
    }
  }

  private localChatReply(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('glaucome')) {
      return (
        '**Glaucome (rappel pédagogique)** : évaluez PIO, pachymétrie, fond d\'œil (excavation), champ visuel et OCT RNFL. ' +
        'Le diagnostic repose sur l\'ensemble des données, pas sur un seul paramètre.'
      );
    }
    if (q.includes('rétine') || q.includes('retine')) {
      return (
        '**Rétine** : distinguez pathologies maculaires vs périphériques. ' +
        'Signes d\'alarme : baisse AV rapide, métamorphopsies, flashs, voile.'
      );
    }
    return (
      `Merci pour votre question sur « ${question.slice(0, 120)} ». ` +
      'En mode local, les réponses sont génériques. Utilisez OPENAI_API_KEY pour des explications détaillées.'
    );
  }
}
