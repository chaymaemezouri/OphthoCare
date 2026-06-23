'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart3, BookOpen, Bot, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  traineeLearningApi,
  type TraineeLearningSession,
  type TraineeProgress,
} from '@/lib/api/trainee-learning';

const typeLabels: Record<string, string> = {
  chat: 'Chat IA',
  quiz: 'Quiz',
  exam_explanation: 'Examen',
};

export function AiLearning() {
  const [progress, setProgress] = useState<TraineeProgress | null>(null);
  const [sessions, setSessions] = useState<TraineeLearningSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, s] = await Promise.all([
          traineeLearningApi.getProgress(),
          traineeLearningApi.listSessions({ take: 10 }),
        ]);
        if (!cancelled) {
          setProgress(p);
          setSessions(s.items);
        }
      } catch {
        if (!cancelled) {
          setProgress(null);
          setSessions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de la progression…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {progress?.disclaimer ? (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {progress.disclaimer}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BarChart3} label="Sessions" value={progress?.totalSessions ?? 0} />
        <StatCard icon={Bot} label="Chats IA" value={progress?.chatSessions ?? 0} />
        <StatCard icon={BookOpen} label="Quiz" value={progress?.quizSessions ?? 0} />
        <StatCard
          icon={Sparkles}
          label="Moy. quiz"
          value={
            progress?.averageQuizScorePercent != null
              ? `${progress.averageQuizScorePercent}%`
              : '—'
          }
        />
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-50 py-3">
          <CardTitle className="text-sm font-semibold">Activité récente</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-50">
          {sessions.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Aucune session enregistrée. Utilisez l&apos;assistant IA ou lancez un quiz.
            </p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {s.title || s.topic || typeLabels[s.type] || s.type}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {format(parseISO(s.updatedAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[9px]">
                    {typeLabels[s.type] ?? s.type}
                  </Badge>
                  {s.scorePercent != null ? (
                    <span className="text-xs font-bold text-emerald-700">{s.scorePercent}%</span>
                  ) : null}
                  <Badge
                    className={
                      s.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 text-[9px]'
                        : 'bg-slate-100 text-slate-600 text-[9px]'
                    }
                  >
                    {s.status === 'completed' ? 'Terminé' : 'En cours'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        <Link href="/dashboard/stagiaire/patients" className="underline hover:text-slate-800">
          Consulter les dossiers patients
        </Link>{' '}
        pour lier vos sessions aux cas observés (lecture seule).
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-slate-100">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
