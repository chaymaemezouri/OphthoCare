'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Loader2, Sparkles } from 'lucide-react';
import { traineeLearningApi, type TraineeMedicalImage } from '@/lib/api/trainee-learning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function fileUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${apiBase}${path}`;
}

export function TraineePatientImagingPanel({ patientId }: { patientId: string }) {
  const [images, setImages] = useState<TraineeMedicalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<{ imageId: string; text: string } | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await traineeLearningApi.listMedicalImages(patientId);
      setImages(res.items);
      setDisclaimer(res.disclaimer);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onExplain = async (img: TraineeMedicalImage) => {
    setBusyId(img.id);
    setExplanation(null);
    try {
      const cached = img.aiAnalysis as { pedagogicalSummary?: string } | null;
      if (cached?.pedagogicalSummary) {
        setExplanation({ imageId: img.id, text: cached.pedagogicalSummary });
        return;
      }
      const res = await traineeLearningApi.explainMedicalImage(img.id);
      setExplanation({ imageId: img.id, text: res.summary });
      setDisclaimer(res.disclaimer);
      await load();
    } catch {
      setExplanation({
        imageId: img.id,
        text: "Impossible de générer l'explication. Réessayez plus tard.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des examens…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {disclaimer ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {disclaimer}
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="text-sm text-slate-500 py-6">Aucune imagerie enregistrée pour ce patient.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((img) => (
            <Card key={img.id} className="border-slate-200/90 overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold truncate">
                    {img.title || img.examType || 'Examen'}
                  </CardTitle>
                  {img.hasPedagogicalExplanation ? (
                    <Badge variant="secondary" className="text-[9px] shrink-0">
                      Expliqué
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {format(parseISO(img.createdAt), 'dd MMM yyyy', { locale: fr })}
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {img.mimeType?.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl(img.fileUrl)}
                    alt={img.title || 'Examen'}
                    className="w-full max-h-48 object-contain rounded-lg border bg-slate-50"
                  />
                ) : (
                  <p className="text-xs text-slate-500">Fichier : {img.mimeType || 'document'}</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  className="w-full rounded-lg bg-slate-900 text-white"
                  disabled={busyId === img.id}
                  onClick={() => void onExplain(img)}
                >
                  {busyId === img.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                  )}
                  Explication pédagogique
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {explanation ? (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Explication IA (pédagogique)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">{explanation.text}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
