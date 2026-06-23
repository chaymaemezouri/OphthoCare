import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { DoctorBillingResponse } from "@/types/doctor-billing";
import { escapeHtml } from "@/lib/prescription-print";
import { APP_CONFIG } from "@/lib/constants/app-config";

function statusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Payé";
    case "pending":
      return "En attente";
    case "partial":
      return "Partiel";
    default:
      return status;
  }
}

function buildRows(data: DoctorBillingResponse) {
  return [
    ["Référence", "Patient", "Date", "Montant", "Encaissé", "Statut", "Mode"],
    ...data.items.map((i) => [
      i.reference,
      i.patientDisplayName,
      format(parseISO(i.date), "dd/MM/yyyy", { locale: fr }),
      String(i.amount),
      String(i.paidAmount),
      statusLabel(i.paymentStatus),
      i.paymentMethodLabel,
    ]),
  ];
}

export function downloadFinancialReportCsv(data: DoctorBillingResponse) {
  const rows: string[][] = [
    [`Rapport financier ${APP_CONFIG.APP_NAME}`, format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })],
    ["Période", data.period],
    [],
    ...buildRows(data),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facturation-${data.period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Compatible Microsoft Excel sans dépendance xlsx. */
export function downloadFinancialReportExcel(data: DoctorBillingResponse) {
  const header = buildRows(data)[0];
  const body = buildRows(data).slice(1);
  const tableRows = [
    `<tr>${header.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`,
    ...body.map(
      (row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`,
    ),
  ].join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>
<table border="1">
<caption>Rapport financier — période ${escapeHtml(data.period)} — ${escapeHtml(format(new Date(), "PPP", { locale: fr }))}</caption>
${tableRows}
</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facturation-${data.period}-${format(new Date(), "yyyy-MM-dd")}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadFinancialReportPdf(data: DoctorBillingResponse) {
  const rows = buildRows(data);
  const head = rows[0];
  const body = rows.slice(1);
  const tableHtml = `
<table style="width:100%;border-collapse:collapse;font-size:12px">
<thead><tr>${head.map((h) => `<th style="border:1px solid #ccc;padding:6px;text-align:left;background:#f5f5f5">${escapeHtml(h)}</th>`).join("")}</tr></thead>
<tbody>
${body.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #ddd;padding:6px">${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
</tbody></table>`;
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Rapport financier</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:18px} .muted{color:#555;font-size:13px}</style></head><body>
<h1>Rapport financier — cabinet</h1>
<p class="muted">Période : ${escapeHtml(data.period)} — généré le ${escapeHtml(format(new Date(), "PPPp", { locale: fr }))}</p>
<p><strong>Revenus période :</strong> ${escapeHtml(String(data.summary.periodRevenue))} — <strong>Impayés :</strong> ${escapeHtml(String(data.summary.unpaidTotal))}</p>
${tableHtml}
</body></html>`;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
