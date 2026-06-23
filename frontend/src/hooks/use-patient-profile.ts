'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type {
  Cim10Diagnosis,
  EmergencyContact,
  FamilyMember,
  MedicalData,
  Patient,
} from '@/types/patient';
import { patientsApi } from '@/lib/api';

const storageKey = (userId: string) => `ophthocare:patient-profile:${userId}`;

export interface PatientProfileDraft {
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  phoneNumber?: string;
  address?: string;
  insuranceCoverage?: string;
  bloodType?: string;
  emergencyContact?: EmergencyContact;
  medicalData?: MedicalData;
  insuranceProvider?: string;
  insuranceNumber?: string;
  cnssAffiliation?: string;
  amoRightsNumber?: string;
  mutuelleName?: string;
  mutuelleContractNumber?: string;
  coverageNotes?: string;
  diagnoses?: Cim10Diagnosis[];
  familyMembers?: FamilyMember[];
}

function readLocal(userId: string): PatientProfileDraft {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PatientProfileDraft & { coverageDetails?: string };
    if (parsed.coverageDetails && !parsed.coverageNotes) {
      parsed.coverageNotes = parsed.coverageDetails;
      delete parsed.coverageDetails;
    }
    return parsed;
  } catch {
    return {};
  }
}

function writeLocal(userId: string, draft: PatientProfileDraft) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(draft));
}

export function usePatientProfile(userId: string | undefined) {
  const [draft, setDraft] = useState<PatientProfileDraft>({});
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const reload = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!userId) {
      setDraft({});
      setPatientId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const local = readLocal(userId);
    setDraft(local);
    (async () => {
      try {
        const remote = (await patientsApi.getMe()) as Patient;
        setPatientId(remote.id);
        const dx = (remote.diagnoses as Cim10Diagnosis[] | undefined) ?? local.diagnoses;
        const merged: PatientProfileDraft = {
          ...local,
          dateOfBirth: remote.dateOfBirth?.slice(0, 10) ?? local.dateOfBirth,
          gender: remote.gender ?? local.gender,
          nationalId: remote.nationalId ?? local.nationalId,
          phoneNumber: remote.user?.phoneNumber ?? remote.phone ?? local.phoneNumber,
          address: remote.address ?? local.address,
          insuranceCoverage: remote.insuranceCoverage ?? local.insuranceCoverage,
          bloodType: remote.bloodType ?? local.bloodType ?? local.medicalData?.bloodGroup,
          emergencyContact: remote.emergencyContact ?? local.emergencyContact,
          medicalData: (remote.medicalData as MedicalData | undefined) ?? local.medicalData,
          insuranceProvider: remote.insuranceProvider ?? local.insuranceProvider,
          insuranceNumber: remote.insuranceNumber ?? local.insuranceNumber,
          cnssAffiliation: remote.cnssAffiliation ?? local.cnssAffiliation,
          amoRightsNumber: remote.amoRightsNumber ?? local.amoRightsNumber,
          mutuelleName: remote.mutuelleName ?? local.mutuelleName,
          mutuelleContractNumber: remote.mutuelleContractNumber ?? local.mutuelleContractNumber,
          coverageNotes: remote.coverageNotes ?? local.coverageNotes,
          diagnoses: dx,
          familyMembers:
            (remote.familyMembers as FamilyMember[] | undefined) ?? local.familyMembers,
        };
        setDraft(merged);
        writeLocal(userId, merged);
      } catch {
        setPatientId(null);
        // Profil local uniquement (hors ligne ou session non patient)
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, fetchKey]);

  const updateDraft = useCallback((patch: Partial<PatientProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(async (): Promise<{ remote: boolean; error?: string }> => {
    if (!userId) return { remote: false, error: 'Session invalide.' };
    writeLocal(userId, draft);
    try {
      await patientsApi.updateMe({
        dateOfBirth: draft.dateOfBirth,
        gender: draft.gender,
        nationalId: draft.nationalId,
        phone: draft.phoneNumber?.trim() || undefined,
        address: draft.address?.trim() || undefined,
        insuranceCoverage: draft.insuranceCoverage?.trim() || undefined,
        bloodType: draft.bloodType?.trim() || draft.medicalData?.bloodGroup?.trim() || undefined,
        allergies: draft.medicalData?.allergies?.length ? draft.medicalData.allergies : undefined,
        antecedents: draft.medicalData?.chronicDiseases?.length
          ? draft.medicalData.chronicDiseases
          : undefined,
        emergencyContact:
          draft.emergencyContact?.name?.trim() &&
          draft.emergencyContact?.relation?.trim() &&
          draft.emergencyContact?.phone?.trim()
            ? {
                name: draft.emergencyContact.name.trim(),
                relation: draft.emergencyContact.relation.trim(),
                phone: draft.emergencyContact.phone.trim(),
              }
            : undefined,
        medicalData: draft.medicalData as Record<string, unknown> | undefined,
        insuranceProvider: draft.insuranceProvider,
        insuranceNumber: draft.insuranceNumber,
        cnssAffiliation: draft.cnssAffiliation,
        amoRightsNumber: draft.amoRightsNumber,
        mutuelleName: draft.mutuelleName,
        mutuelleContractNumber: draft.mutuelleContractNumber,
        coverageNotes: draft.coverageNotes,
        diagnoses: draft.diagnoses
          ?.filter((d) => d.code?.trim() && d.label?.trim())
          .map((d) => ({
            code: d.code.trim(),
            label: d.label.trim(),
            notes: d.notes?.trim() || undefined,
            recordedAt: d.recordedAt,
          })),
        familyMembers: draft.familyMembers
          ?.filter((m) => m.name?.trim() && m.relationship?.trim())
          .map((m) => ({
            name: m.name.trim(),
            relationship: m.relationship.trim(),
            dateOfBirth: m.dateOfBirth || undefined,
          })),
      });
      return { remote: true };
    } catch (e) {
      let msg = 'Impossible de synchroniser avec le serveur.';
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { message?: string | string[] } | undefined;
        if (typeof data?.message === 'string') msg = data.message;
        else if (Array.isArray(data?.message)) msg = data.message.join(', ');
      }
      return { remote: false, error: msg };
    }
  }, [userId, draft]);

  return {
    draft,
    setDraft: updateDraft,
    loading,
    save,
    patientId,
    reload,
    persistedLocally: Boolean(userId),
  };
}
