'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, ImageIcon, Loader2, Mail, Plus, Sparkles, Upload } from 'lucide-react';
import { doctorToolsApi, type PatientMedicalImage, type MedicalReport, type ReferralLetter } from '@/lib/api/doctor-tools';
import { buildReferralPrintHtml, buildReportPrintHtml, printHtml } from '@/lib/report-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AIImagingViewer } from '@/components/medical/ai-imaging-viewer';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function fileUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${apiBase}${path}`;
}

export function DoctorPatientDocumentsPanel({
  patientId,
  patientName,
  doctorName,
  readOnly,
}: {
  patientId: string;
  patientName: string;
  doctorName: string;
  readOnly?: boolean;
}) {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [referrals, setReferrals] = useState<ReferralLetter[]>([]);
  const [images, setImages] = useState<PatientMedicalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [viewerImage, setViewerImage] = useState<PatientMedicalImage | null>(null);

  const [reportTitle, setReportTitle] = useState('Compte rendu de consultation');
  const [reportContent, setReportContent] = useState('');
  const [refName, setRefName] = useState('');
  const [refSpecialty, setRefSpecialty] = useState('');
  const [refBody, setRefBody] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, ref, img] = await Promise.all([
        doctorToolsApi.listReports(patientId),
        doctorToolsApi.listReferrals(patientId),
        doctorToolsApi.listMedicalImages(patientId),
      ]);
      setReports(r.items);
      setReferrals(ref.items);
      setImages(img.items);
    } catch {
      setReports([]);
      setReferrals([]);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createReport = async () => {
    if (!reportContent.trim()) return;
    setBusy(true);
    try {
      await doctorToolsApi.createReport({
        patientId,
        title: reportTitle.trim(),
        content: reportContent.trim(),
      });
      setReportContent('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const createReferral = async () => {
    if (!refName.trim() || !refBody.trim()) return;
    setBusy(true);
    try {
      await doctorToolsApi.createReferral({
        patientId,
        recipientName: refName.trim(),
        recipientSpecialty: refSpecialty.trim() || undefined,
        body: refBody.trim(),
      });
      setRefName('');
      setRefSpecialty('');
      setRefBody('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await doctorToolsApi.uploadMedicalImage(patientId, file, {
        examType: 'imagerie',
        title: file.name,
      });
      await load();
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!readOnly ? (
        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Nouveau compte rendu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Titre</Label>
              <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
            </div>
            <div>
              <Label>Contenu</Label>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-slate-200 p-3 text-sm"
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
              />
            </div>
            <Button disabled={busy} onClick={() => void createReport()}>
              Enregistrer et notifier le patient
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle className="text-sm">Comptes rendus ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun compte rendu.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="flex items-start justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {format(parseISO(r.createdAt), 'PPp', { locale: fr })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    printHtml(
                      buildReportPrintHtml({
                        title: r.title,
                        content: r.content,
                        patientName,
                        doctorName,
                      }),
                    )
                  }
                >
                  Imprimer
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!readOnly ? (
        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Lettre de référence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Destinataire (Dr…)" value={refName} onChange={(e) => setRefName(e.target.value)} />
            <Input placeholder="Spécialité" value={refSpecialty} onChange={(e) => setRefSpecialty(e.target.value)} />
            <textarea
              className="min-h-[100px] w-full rounded-md border border-slate-200 p-3 text-sm"
              placeholder="Corps de la lettre"
              value={refBody}
              onChange={(e) => setRefBody(e.target.value)}
            />
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => void createReferral()}>
                <Plus className="mr-2 h-4 w-4" />
                Brouillon
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Lettres ({referrals.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {referrals.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-semibold">{l.recipientName}</p>
                <p className="text-xs text-slate-500">{l.status}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    printHtml(
                      buildReferralPrintHtml({
                        recipientName: l.recipientName,
                        recipientSpecialty: l.recipientSpecialty ?? undefined,
                        recipientAddress: l.recipientAddress ?? undefined,
                        body: l.body,
                        patientName,
                        doctorName,
                      }),
                    )
                  }
                >
                  Imprimer
                </Button>
                {l.status === 'draft' && !readOnly ? (
                  <Button size="sm" disabled={busy} onClick={() => void doctorToolsApi.sendReferral(l.id).then(load)}>
                    Envoyer
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4" />
            Examens & imagerie ({images.length})
          </CardTitle>
          {!readOnly ? (
            <Label className="cursor-pointer">
              <Upload className="mr-1 inline h-4 w-4" />
              Ajouter
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => void onUpload(e)} />
            </Label>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {images.map((img) => (
            <div key={img.id} className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{img.title ?? img.examType ?? 'Examen'}</p>
              {img.mimeType?.startsWith('image/') ? (
                <img src={fileUrl(img.fileUrl)} alt="" className="mt-2 max-h-32 rounded object-cover" />
              ) : (
                <a href={fileUrl(img.fileUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-600">
                  Ouvrir le fichier
                </a>
              )}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setViewerImage(img)}>
                  Visualiser
                </Button>
                {!readOnly ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void doctorToolsApi.analyzeMedicalImage(img.id).then(load)}
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Analyse IA
                  </Button>
                ) : null}
              </div>
              {img.aiAnalysis && typeof img.aiAnalysis === 'object' && 'summary' in (img.aiAnalysis as object) ? (
                <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
                  {(img.aiAnalysis as { summary?: string }).summary}
                </p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {viewerImage ? (
        <AIImagingViewer
          title={viewerImage.title ?? 'Examen'}
          date={format(parseISO(viewerImage.createdAt), 'PPp', { locale: fr })}
          onClose={() => setViewerImage(null)}
        />
      ) : null}
    </div>
  );
}
