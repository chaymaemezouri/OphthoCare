'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Printer, Send, Trash2 } from 'lucide-react';
import { documentsApi, type PrescriptionDoc } from '@/lib/api/documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type MedLine = PrescriptionDoc['medications'][number];

const PRESCRIPTION_TYPES = [
  { id: 'STANDARD', label: 'Standard' },
  { id: 'OPTIC', label: 'Optique' },
  { id: 'KINE', label: 'Kinésithérapie' },
  { id: 'WORK_STOPPAGE', label: 'Arrêt de travail' },
  { id: 'DIET', label: 'Régime' },
];

const emptyLine = (): MedLine => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });

export function PrescriptionForm({
  patientId,
  consultationId,
  readOnly,
  onCreated,
}: {
  patientId: string;
  consultationId?: string;
  readOnly?: boolean;
  onCreated?: () => void;
}) {
  const [type, setType] = useState('STANDARD');
  const [lines, setLines] = useState<MedLine[]>([emptyLine()]);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; dosages: string[] }>>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<PrescriptionDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchMeds = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const rows = await documentsApi.searchMedications(q);
      setSuggestions(rows.map((r) => ({ id: r.id, name: r.name, dosages: r.dosages })));
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const q = lines[activeIdx]?.name ?? '';
    const t = window.setTimeout(() => void searchMeds(q), 300);
    return () => window.clearTimeout(t);
  }, [lines, activeIdx, searchMeds]);

  const pollPdf = useCallback(async (id: string) => {
    for (let i = 0; i < 12; i++) {
      const row = await documentsApi.getPrescription(id);
      setCreated(row);
      if (row.pdfStatus === 'ready' && row.pdfUrl) return;
      if (row.pdfStatus === 'failed') return;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }, []);

  const handleGenerate = async () => {
    setSaving(true);
    setError(null);
    try {
      const meds = lines.filter((l) => l.name.trim());
      if (meds.length === 0) throw new Error('Ajoutez au moins un médicament');
      const row = await documentsApi.createPrescription({
        patientId,
        consultationId,
        type,
        medications: meds,
      });
      setCreated(row);
      await pollPdf(row.id);
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Génération impossible');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!created) return;
    setSaving(true);
    try {
      await documentsApi.sendPrescription(created.id);
    } catch {
      setError('Envoi au patient refusé');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200/90">
      <CardHeader>
        <CardTitle className="text-base">Ordonnance PDF</CardTitle>
        <CardDescription>Médicaments structurés, génération serveur avec QR d&apos;authenticité.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => v && setType(v)} disabled={readOnly}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESCRIPTION_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {lines.map((line, idx) => (
          <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">Médicament {idx + 1}</span>
              {!readOnly && lines.length > 1 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setLines((l) => l.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
            <Input
              placeholder="Nom (auto-complétion)"
              value={line.name}
              disabled={readOnly}
              onFocus={() => setActiveIdx(idx)}
              onChange={(e) => {
                const v = e.target.value;
                setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, name: v } : l)));
              }}
              className="rounded-lg"
            />
            {activeIdx === idx && suggestions.length > 0 ? (
              <ul className="max-h-32 overflow-auto rounded border bg-white text-sm">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full px-2 py-1.5 text-left hover:bg-slate-100"
                      onClick={() => {
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, name: s.name, dosage: s.dosages[0] ?? l.dosage } : l,
                          ),
                        );
                        setSuggestions([]);
                      }}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Dosage"
                value={line.dosage ?? ''}
                disabled={readOnly}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, dosage: e.target.value } : l)))
                }
                className="rounded-lg"
              />
              <Input
                placeholder="Fréquence"
                value={line.frequency ?? ''}
                disabled={readOnly}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, frequency: e.target.value } : l)))
                }
                className="rounded-lg"
              />
              <Input
                placeholder="Durée"
                value={line.duration ?? ''}
                disabled={readOnly}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, duration: e.target.value } : l)))
                }
                className="rounded-lg"
              />
              <Input
                placeholder="Instructions"
                value={line.instructions ?? ''}
                disabled={readOnly}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, instructions: e.target.value } : l)))
                }
                className="rounded-lg"
              />
            </div>
          </div>
        ))}

        {!readOnly ? (
          <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setLines((l) => [...l, emptyLine()])}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter médicament
          </Button>
        ) : null}

        {created?.pdfUrl ? (
          <div className="space-y-2">
            <Label>Aperçu PDF</Label>
            <iframe title="Ordonnance PDF" src={created.pdfUrl} className="h-[480px] w-full rounded-lg border" />
          </div>
        ) : created?.pdfStatus === 'pending' ? (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Génération PDF en cours…
          </p>
        ) : null}

        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-lg font-semibold" disabled={saving} onClick={() => void handleGenerate()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Générer PDF
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              disabled={!created?.pdfUrl || saving}
              onClick={() => void handleSend()}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Envoyer au patient
            </Button>
            {created?.pdfUrl ? (
              <Button variant="outline" className="rounded-lg" asChild>
                <a href={created.pdfUrl} target="_blank" rel="noreferrer">
                  <Printer className="mr-1.5 h-4 w-4" />
                  Imprimer
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
