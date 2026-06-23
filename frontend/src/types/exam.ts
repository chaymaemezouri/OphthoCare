/** Types examens / imagerie — à étendre (DICOM, OCT, etc.) */
export interface ExamAttachment {
  id: string;
  label: string;
  url?: string;
  createdAt: string;
}
