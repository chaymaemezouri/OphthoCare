'use client';

import { buildReportPrintHtml, printHtml } from '@/lib/report-print';

export function ReportPdf(props: {
  title: string;
  content: string;
  patientName: string;
  doctorName: string;
}) {
  return (
    <button
      type="button"
      className="text-xs text-blue-600 underline"
      onClick={() =>
        printHtml(
          buildReportPrintHtml({
            title: props.title,
            content: props.content,
            patientName: props.patientName,
            doctorName: props.doctorName,
          }),
        )
      }
    >
      Imprimer le compte rendu
    </button>
  );
}
