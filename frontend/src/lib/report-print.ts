import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { escapeHtml } from "@/lib/prescription-print";

export function buildReportPrintHtml(opts: {
  title: string;
  content: string;
  patientName: string;
  doctorName: string;
  issuedAt?: string;
}) {
  const issuedAt = opts.issuedAt ?? format(new Date(), "PPP", { locale: fr });
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${escapeHtml(opts.title)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; color: #111; }
  h1 { font-size: 1.25rem; }
  .box { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-top: 16px; white-space: pre-wrap; line-height: 1.55; }
  .muted { color: #555; font-size: 0.875rem; }
</style></head><body>
  <h1>${escapeHtml(opts.title)}</h1>
  <p class="muted">Compte rendu — ${escapeHtml(issuedAt)} — OphthoCare</p>
  <p><strong>Patient :</strong> ${escapeHtml(opts.patientName)}</p>
  <p><strong>Médecin :</strong> ${escapeHtml(opts.doctorName)}</p>
  <div class="box">${escapeHtml(opts.content)}</div>
</body></html>`;
}

export function buildReferralPrintHtml(opts: {
  recipientName: string;
  recipientSpecialty?: string;
  recipientAddress?: string;
  body: string;
  patientName: string;
  doctorName: string;
}) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Lettre de référence</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; line-height: 1.55; }
  .box { margin-top: 24px; white-space: pre-wrap; }
</style></head><body>
  <p><strong>Lettre de référence</strong></p>
  <p>À l'attention de ${escapeHtml(opts.recipientName)}${opts.recipientSpecialty ? ` (${escapeHtml(opts.recipientSpecialty)})` : ""}</p>
  ${opts.recipientAddress ? `<p>${escapeHtml(opts.recipientAddress)}</p>` : ""}
  <p class="box">Cher confrère / Chère consœur,

Concernant le patient ${escapeHtml(opts.patientName)} :

${escapeHtml(opts.body)}

Cordialement,
${escapeHtml(opts.doctorName)}</p>
</body></html>`;
}

export function printHtml(html: string): { ok: boolean; error?: string } {
  try {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return { ok: false, error: "Popup bloquée" };
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impression impossible" };
  }
}
