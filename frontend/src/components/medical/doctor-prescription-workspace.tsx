"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Pill,
  Printer,
  Send,
} from "lucide-react";
import { buildPrescriptionPrintHtml, printPrescriptionHtml } from "@/lib/prescription-print";
import { consultationsApi } from "@/lib/api";
import type { ConsultationApiDetail } from "@/types/consultation";
import type { MedicalAppointmentSummary, Patient } from "@/types/patient";
import { useDoctorProfile } from "@/hooks/use-doctor-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NO_CONSULTATION = "__none_consult__";

type ConsultationListRow = {
  id: string;
  createdAt: string;
  status: string;
  specialtyCode: string;
  closedAt: string | null;
  plan: string | null;
  prescriptionIds: string[];
  doctorName: string;
  appointment: { id: string; startTime: string } | null;
};

function consultationStatusFr(s: string) {
  switch (s) {
    case "draft":
      return "Brouillon";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Clôturée";
    default:
      return s;
  }
}

export function DoctorPrescriptionWorkspace({
  patientId,
  patient,
  appointments,
  readOnly,
  onSaved,
}: {
  patientId: string;
  patient: Patient | null;
  appointments: MedicalAppointmentSummary[];
  readOnly: boolean;
  onSaved: () => void;
}) {
  const { doctor } = useDoctorProfile(!readOnly);
  const [list, setList] = useState<ConsultationListRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [detail, setDetail] = useState<ConsultationApiDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [planDraft, setPlanDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ variant: "success" | "error"; text: string } | null>(null);
  const [newApptId, setNewApptId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);

  const patientName = useMemo(() => {
    if (!patient) return "";
    const u = patient.user;
    return [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email || "Patient";
  }, [patient]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const rows = await consultationsApi.getByPatient(patientId);
      setList(Array.isArray(rows) ? rows : []);
    } catch {
      setList([]);
      setListError("Impossible de charger les consultations de ce patient.");
    } finally {
      setListLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setPlanDraft("");
      return;
    }
    setDetailLoading(true);
    consultationsApi
      .getById(selectedId)
      .then((d) => {
        setDetail(d);
        setPlanDraft(d.plan ?? "");
      })
      .catch(() => {
        setDetail(null);
        setPlanDraft("");
        setBanner({ variant: "error", text: "Consultation introuvable ou accès refusé." });
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 4500);
    return () => window.clearTimeout(t);
  }, [banner]);

  const selectedRow = useMemo(() => list.find((r) => r.id === selectedId), [list, selectedId]);
  const isClosed = detail?.status === "completed";

  const doctorPrintName = useMemo(() => {
    if (!doctor) return selectedRow?.doctorName ?? "Médecin";
    const u = doctor.user;
    const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return n ? `Dr. ${n}` : selectedRow?.doctorName ?? "Médecin";
  }, [doctor, selectedRow?.doctorName]);

  const handleSavePlan = async () => {
    if (!detail || readOnly || isClosed) return;
    setSaving(true);
    try {
      await consultationsApi.update(detail.id, { plan: planDraft });
      setBanner({ variant: "success", text: "Ordonnance enregistrée sur la consultation (champ « plan »)." });
      await loadList();
      onSaved();
    } catch {
      setBanner({ variant: "error", text: "Enregistrement refusé (consultation clôturée ou droits)." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPrescriptionRef = async () => {
    if (!detail || readOnly || isClosed) return;
    const id = crypto.randomUUID();
    const next = [...(detail.prescriptionIds ?? []), id];
    setSaving(true);
    try {
      await consultationsApi.update(detail.id, { prescriptionIds: next });
      const d = await consultationsApi.getById(detail.id);
      setDetail(d);
      setBanner({
        variant: "success",
        text: `Référence ajoutée : ${id}. Elle apparaît dans l’espace patient (documents) comme lien d’ordonnance.`,
      });
      await loadList();
      onSaved();
    } catch {
      setBanner({ variant: "error", text: "Impossible d’ajouter la référence." });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const html = buildPrescriptionPrintHtml({
      patientName,
      patientDob: patient?.dateOfBirth,
      doctorName: doctorPrintName,
      doctorCity: doctor?.city,
      plan: planDraft || "—",
      prescriptionIds: detail?.prescriptionIds ?? [],
    });
    const result = printPrescriptionHtml(html);
    if (!result.ok) {
      setBanner({ variant: "error", text: "Pop-up bloquée : autorisez la fenêtre pour imprimer / PDF." });
    }
  };

  const handleShareWithPatient = async () => {
    if (!detail || readOnly) return;
    if (!planDraft.trim()) {
      setBanner({ variant: "error", text: "Enregistrez d’abord le texte de l’ordonnance." });
      return;
    }
    setSharing(true);
    try {
      if (planDraft !== (detail.plan ?? "")) {
        await consultationsApi.update(detail.id, { plan: planDraft });
      }
      await consultationsApi.sharePrescriptionWithPatient(detail.id);
      setBanner({
        variant: "success",
        text: "Ordonnance envoyée au patient (notification + consultation).",
      });
      const d = await consultationsApi.getById(detail.id);
      setDetail(d);
      await loadList();
      onSaved();
    } catch {
      setBanner({ variant: "error", text: "Envoi impossible (texte vide ou droits)." });
    } finally {
      setSharing(false);
    }
  };

  const handleCopyAll = async () => {
    const block = [
      `Patient : ${patientName}`,
      doctor ? `Prescripteur : ${doctorPrintName}` : "",
      detail?.prescriptionIds?.length ? `Références : ${detail.prescriptionIds.join(", ")}` : "",
      "",
      planDraft,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(block);
      setBanner({ variant: "success", text: "Texte copié (à coller dans un message sécurisé ou un courriel)." });
    } catch {
      setBanner({ variant: "error", text: "Copie impossible." });
    }
  };

  const handleCreateConsultation = async () => {
    if (readOnly) return;
    setCreating(true);
    try {
      const created = await consultationsApi.create({
        patientId,
        appointmentId: newApptId || undefined,
      });
      setSelectedId(created.id);
      setNewApptId("");
      setBanner({ variant: "success", text: "Nouvelle consultation créée — rédigez l’ordonnance puis enregistrez." });
      await loadList();
      onSaved();
    } catch {
      setBanner({ variant: "error", text: "Création impossible (vérifiez le RDV lié ou vos droits)." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {readOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Mode lecture seule.</strong> Vous pouvez consulter le texte, imprimer ou copier. La création de
          consultation et l’enregistrement d’ordonnance sont réservés au médecin.
        </div>
      ) : null}

      {banner ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            banner.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
            banner.variant === "error" && "border-red-200 bg-red-50 text-red-950",
          )}
        >
          {banner.text}
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50/60">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            <Pill className="h-4 w-4 text-cyan-700" aria-hidden />
            Consultation cible
          </CardTitle>
          <CardDescription className="text-xs text-zinc-600">
            Une ordonnance est toujours rattachée à une consultation. Les consultations clôturées ne sont plus modifiables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {listLoading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-700" aria-hidden />
              Chargement des consultations…
            </div>
          ) : listError ? (
            <p className="text-sm text-red-800">{listError}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label>Consultation existante</Label>
                  <Select
                    value={selectedId || NO_CONSULTATION}
                    onValueChange={(v) => setSelectedId(v === NO_CONSULTATION ? "" : (v ?? ""))}
                  >
                    <SelectTrigger className="rounded-lg border-zinc-200">
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CONSULTATION}>Sélectionner une consultation…</SelectItem>
                      {list.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {format(parseISO(r.createdAt), "d MMM yyyy HH:mm", { locale: fr })} —{" "}
                          {consultationStatusFr(r.status)}
                          {r.closedAt ? " (clôturée)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" className="rounded-lg border-zinc-200" onClick={() => void loadList()}>
                  Rafraîchir la liste
                </Button>
              </div>

              {!readOnly ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nouvelle consultation</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Utile si aucune ligne ouverte n’existe. Vous pouvez lier un rendez-vous existant (optionnel).
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rendez-vous (optionnel)</Label>
                      <Select value={newApptId || "__none__"} onValueChange={(v) => setNewApptId(v === "__none__" ? "" : (v ?? ""))}>
                        <SelectTrigger className="rounded-lg border-zinc-200">
                          <SelectValue placeholder="Sans lien RDV" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sans lien RDV</SelectItem>
                          {appointments.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {format(parseISO(a.startTime), "d MMM yyyy HH:mm", { locale: fr })} — {a.reason || "RDV"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        className="w-full rounded-lg bg-zinc-900 text-white"
                        disabled={creating}
                        onClick={() => void handleCreateConsultation()}
                      >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer une consultation"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {selectedId ? (
        <Card className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/60">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                  <FileText className="h-4 w-4 text-cyan-700" aria-hidden />
                  Rédaction ordonnance
                </CardTitle>
              </div>
              {detail ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-lg text-xs">
                    {consultationStatusFr(detail.status)}
                  </Badge>
                  {isClosed ? (
                    <Badge className="rounded-lg bg-zinc-200 text-zinc-800">Lecture seule (clôturée)</Badge>
                  ) : (
                    <Badge className="rounded-lg bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200/80">
                      <CheckCircle2 className="mr-1 inline h-3 w-3" aria-hidden />
                      Modifiable
                    </Badge>
                  )}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Chargement…
              </div>
            ) : (
              <>
                {detail?.prescriptionIds?.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Références dossier</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {detail.prescriptionIds.map((pid) => (
                        <li key={pid}>
                          <code className="rounded-md bg-zinc-100 px-2 py-0.5 text-[0.6875rem] text-zinc-800">{pid}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="rx-plan">Texte de l’ordonnance</Label>
                  <textarea
                    id="rx-plan"
                    disabled={isClosed || readOnly}
                    className="min-h-[200px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/25 disabled:bg-zinc-50"
                    placeholder={`Exemple :\n- Tobramycine collyre 1 goutte OD/OG 4×/j pendant 7 jours\n- Artelac UNIDOSE si besoin\nRenouvellement : non`}
                    value={planDraft}
                    onChange={(e) => setPlanDraft(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="rounded-lg bg-zinc-900 text-white"
                    disabled={saving || isClosed || readOnly}
                    onClick={() => void handleSavePlan()}
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enregistrer sur la consultation
                  </Button>
                  <Button type="button" variant="outline" className="rounded-lg border-zinc-200" onClick={() => void handlePrint()}>
                    <Printer className="mr-2 h-4 w-4" aria-hidden />
                    Imprimer / PDF
                  </Button>
                  <Button type="button" variant="outline" className="rounded-lg border-zinc-200" onClick={() => void handleCopyAll()}>
                    <Copy className="mr-2 h-4 w-4" aria-hidden />
                    Copier le texte
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-lg"
                    disabled={sharing || readOnly || !planDraft.trim()}
                    onClick={() => void handleShareWithPatient()}
                  >
                    {sharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" aria-hidden />}
                    Envoyer au patient
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-lg"
                    disabled={saving || isClosed || readOnly}
                    onClick={() => void handleAddPrescriptionRef()}
                  >
                    Ajouter une référence dossier (UUID)
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
