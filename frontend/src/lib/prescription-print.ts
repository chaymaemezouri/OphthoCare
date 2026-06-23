import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildPrescriptionPrintHtml(opts: {
  patientName: string;
  patientDob?: string;
  doctorName: string;
  doctorCity?: string;
  plan: string;
  prescriptionIds: string[];
  issuedAt?: string;
}) {
  const issuedAt = opts.issuedAt ?? format(new Date(), "PPPp", { locale: fr });
  const refs =
    opts.prescriptionIds.length > 0
      ? `<p><strong>Références dossier :</strong> ${escapeHtml(opts.prescriptionIds.join(", "))}</p>`
      : "";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Ordonnance</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; color: #111; }
  h1 { font-size: 1.25rem; margin: 0 0 8px; }
  .muted { color: #555; font-size: 0.875rem; }
  .box { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-top: 16px; white-space: pre-wrap; line-height: 1.5; }
  footer { margin-top: 24px; font-size: 0.75rem; color: #666; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>Ordonnance / prescription médicale</h1>
  <p class="muted">Émise le ${escapeHtml(issuedAt)} — OphthoCare</p>
  <p><strong>Patient :</strong> ${escapeHtml(opts.patientName)}${opts.patientDob ? ` — né(e) le ${escapeHtml(opts.patientDob)}` : ""}</p>
  <p><strong>Prescripteur :</strong> ${escapeHtml(opts.doctorName)}${opts.doctorCity ? ` — ${escapeHtml(opts.doctorCity)}` : ""}</p>
  ${refs}
  <div class="box">${escapeHtml(opts.plan || "—")}</div>
  <footer>Signature et cachet du médecin : _______________________</footer>
</body></html>`;
}

export function printPrescriptionHtml(html: string): { ok: true } | { ok: false; reason: "popup_blocked" } {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return { ok: false, reason: "popup_blocked" };
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return { ok: true };
}
