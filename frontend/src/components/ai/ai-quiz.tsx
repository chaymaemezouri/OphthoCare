'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { traineeLearningApi, type TraineeQuizQuestion } from '@/lib/api/trainee-learning';
import { cn } from '@/lib/utils';

export function AiQuiz({ defaultTopic = 'Glaucome et PIO' }: { defaultTopic?: string }) {
  const [topic, setTopic] = useState(defaultTopic);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TraineeQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [result, setResult] = useState<{
    scorePercent: number;
    correct: number;
    total: number;
    results: { id: string; correct: boolean; explanation: string }[];
  } | null>(null);

  const startQuiz = async () => {
    const t = topic.trim();
    if (!t) return;
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const res = await traineeLearningApi.generateQuiz({ topic: t, questionCount: 5 });
      setSessionId(res.sessionId);
      setQuestions(res.questions);
      setDisclaimer(res.disclaimer);
    } catch {
      setQuestions([]);
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const res = await traineeLearningApi.submitQuiz(sessionId, answers);
      setResult({
        scorePercent: res.scorePercent,
        correct: res.correct,
        total: res.total,
        results: res.results,
      });
      setDisclaimer(res.disclaimer);
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="border-b border-slate-50 py-4">
        <CardTitle className="text-sm font-semibold">Quiz IA — entraînement</CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {disclaimer ? (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {disclaimer}
          </p>
        ) : null}

        {!sessionId || result ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Thème du quiz</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="rounded-lg h-9 text-sm"
                placeholder="Ex. DMLA, cataracte, urgences rétine…"
              />
            </div>
            <Button
              type="button"
              className="self-end rounded-lg bg-slate-900 text-white h-9"
              disabled={loading}
              onClick={() => void startQuiz()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Générer le quiz'}
            </Button>
          </div>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <p className="text-lg font-bold text-slate-900">
              Score : {result.scorePercent}% ({result.correct}/{result.total})
            </p>
            {result.results.map((r) => (
              <div
                key={r.id}
                className={cn(
                  'rounded-lg border p-3 text-sm',
                  r.correct ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50',
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  {r.correct ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Question {r.id}
                </div>
                <p className="mt-1 text-xs text-slate-600">{r.explanation}</p>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setResult(null);
                setSessionId(null);
                setQuestions([]);
              }}
            >
              Nouveau quiz
            </Button>
          </div>
        ) : null}

        {sessionId && !result && questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-lg border border-slate-100 p-4 space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  {qi + 1}. {q.prompt}
                </p>
                <div className="space-y-1">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      className={cn(
                        'w-full text-left rounded-lg border px-3 py-2 text-xs transition',
                        answers[q.id] === oi
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-100 hover:border-slate-300',
                      )}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              type="button"
              className="w-full rounded-lg bg-slate-900 text-white"
              disabled={!allAnswered || submitting}
              onClick={() => void submit()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider mes réponses'}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
