/** Ordonnance — à aligner sur le modèle backend */
export interface PrescriptionLine {
  medication: string;
  dosage?: string;
  duration?: string;
}

export interface Prescription {
  id: string;
  lines: PrescriptionLine[];
  issuedAt: string;
}
