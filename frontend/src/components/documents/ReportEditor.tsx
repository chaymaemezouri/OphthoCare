'use client';

import { useState } from 'react';
import { Loader2, Share2, Sparkles, Send } from 'lucide-react';
import { documentsApi } from '@/lib/api/documents';
import { doctorToolsApi } from '@/lib/api/doctor-tools';
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

const REPORT_TYPES = [
  { id: 'CONSULTATION', label: 'Compte rendu' },
  { id: 'CERTIFICATE', label: 'Certificat' },
  { id: 'REFERRAL', label: 'Référence' },
  { id: 'DISCHARGE', label: 'Sortie' },
  { id: 'WORK_STOPPAGE', label: 'Arrêt travail' },
];

export function ReportEditor({
  patientId,
  consultationId,
  readOnly,
}: {
  patientId: string;
  consultationId?: string;
  readOnly?: boolean;
}) {
  const [title, setTitle] = useState('Compte rendu de consultation');
  const [content, setContent] = useState('');
  const [reportType, setReportType] = useState('CONSULTATION');
  const [reportId, setReportId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const saveAndPdf = async () => {
    setBusy(true);
    try {
      const row = reportId
        ? await documentsApi.patchReport(reportId, { title, content, reportType })
        : await documentsApi.createReport({ patientId, consultationId, title, content, reportType });
      setReportId(row.id);
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const fresh = await documentsApi.getReport(row.id);
        if (fresh.pdfStatus === 'ready' && fresh.pdfUrl) {
          setPdfUrl(fresh.pdfUrl);
          break;
        }
        if (fresh.pdfStatus === 'failed') break;
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAi = async () => {
    if (!consultationId) return;
    setAiBusy(true);
    try {
      const res = await doctorToolsApi.aiChat({
        messages: [
          {
            role: 'user',
            content: `Rédige un brouillon de compte rendu médical (${reportType}) pour le patient. Style professionnel, sections claires.`,
          },
        ],
        patientId,
        context: consultationId ? `consultationId=${consultationId}` : undefined,
      });
      const text = res.reply ?? '';
      if (text) setContent((c) => (c ? `${c}\n\n${text}` : text));
    } catch {
      setContent((c) => c || 'Brouillon IA indisponible — rédigez manuellement.');
    } finally {
      setAiBusy(false);
    }
  };

  const handleShare = async () => {
    if (!reportId) return;
    const res = await documentsApi.shareReport(reportId);
    setShareUrl(res.shareUrl);
  };

  const handleSend = async () => {
    if (!reportId) return;
    setBusy(true);
    try {
      const res = await documentsApi.sendReport(reportId);
      if (res.pdfUrl) setPdfUrl(res.pdfUrl);
    } finally {
      setBusy(false);
    }
  };

  const wrap = (cmd: string) => {
    const ta = document.getElementById('report-editor-area') as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const next = content.slice(0, start) + cmd.replace('{}', sel || 'texte') + content.slice(end);
    setContent(next);
  };

  return (
    <Card className="border-slate-200/90">
      <CardHeader>
        <CardTitle className="text-base">Compte rendu PDF</CardTitle>
        <CardDescription>Éditeur enrichi, partage 24h, envoi patient.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={reportType} onValueChange={(v) => v && setReportType(v)} disabled={readOnly}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} className="rounded-lg" />
          </div>
        </div>

        {!readOnly ? (
          <div className="flex flex-wrap gap-1">
            <Button type="button" size="sm" variant="outline" onClick={() => wrap('**{}**')}>
              Gras
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => wrap('_{}_')}>
              Italique
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setContent((c) => `${c}\n- `)}>
              Liste
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!consultationId || aiBusy}
              onClick={() => void handleAi()}
            >
              {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
              Suggestion IA
            </Button>
          </div>
        ) : null}

        <textarea
          id="report-editor-area"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={readOnly}
          rows={12}
          className="flex min-h-[200px] w-full rounded-lg border border-input bg-white px-3 py-2 font-mono text-sm"
          placeholder="Contenu du compte rendu…"
        />

        {pdfUrl ? <iframe title="CR PDF" src={pdfUrl} className="h-[400px] w-full rounded-lg border" /> : null}
        {shareUrl ? (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Lien partage (24h) : {shareUrl}
          </p>
        ) : null}

        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-lg" disabled={busy} onClick={() => void saveAndPdf()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Générer PDF
            </Button>
            <Button variant="outline" className="rounded-lg" disabled={!reportId} onClick={() => void handleShare()}>
              <Share2 className="mr-1.5 h-4 w-4" />
              Partager
            </Button>
            <Button variant="outline" className="rounded-lg" disabled={!reportId || busy} onClick={() => void handleSend()}>
              <Send className="mr-1.5 h-4 w-4" />
              Envoyer au patient
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
