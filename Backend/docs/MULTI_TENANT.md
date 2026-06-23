# Isolation multi-tenant (DoctorSpace)

Chaque **cabinet** (`DoctorSpace`) est un silo logique. Les données cliniques et l’agenda ne doivent pas fuiter entre cabinets, même si un même `patientId` est suivi par plusieurs médecins.

## Règle générale

| Rôle | `doctorSpaceId` JWT | Filtre requêtes |
|------|---------------------|-----------------|
| **Médecin** | Oui (son cabinet) | Toujours `WHERE doctorSpaceId = …` (+ `doctorId` pour l’agenda) |
| **Secrétaire** | Oui (cabinet employeur) | Idem |
| **Stagiaire** | Oui | Idem (lecture seule métier ; pas d’écriture clinique / agenda) |
| **Patient** | Non | Vue **agrégée** : ses RDV et dossiers via `PatientDoctorAccess` / `patientId`, tous cabinets confondus |
| **Admin** | Non | **Pas de filtre tenant** (support / modération) |
| **Public** (non authentifié) | — | Données explicitement publiques uniquement |

Helpers : `Backend/src/common/tenant/doctor-space-scope.ts`

- `resolveStaffDoctorSpaceId(requester)` → id cabinet ou `null` (patient / admin)
- `appointmentWhereForCabinetAgenda(doctorId, doctorSpaceId, extra?)` → filtre agenda défense en profondeur

## Porte d’entrée patient

`PatientsService.assertCanAccessPatient` :

- **Staff** : lien `PatientDoctorAccess` pour le `doctorSpaceId` du JWT
- **Patient** : `patient.userId === requester.id` (ou famille gérée)
- **Admin** : autorisé sans filtre cabinet

## Données scopées par cabinet

| Domaine | Colonne / jointure | Staff filtre |
|---------|-------------------|--------------|
| Consultations | `Consultation.doctorSpaceId` | Oui |
| Rendez-vous | `Appointment.doctorSpaceId` | Oui (liste + jour/semaine + lecture) |
| Notes cliniques | `MedicalRecord.doctorSpaceId` | Oui (`listForPatient`, `getOne`, timeline) |
| Timeline dossier | RDV + `MedicalRecord` + audits | Oui (audits : éditeurs du cabinet) |
| Outils médecin / IA stagiaire | `doctorSpaceId` | Oui |
| Liste patients cabinet | `PatientDoctorAccess` | Oui |

Migration backfill : `20260519150000_medical_record_doctor_space` (RDV legacy + notes depuis RDV ou auteur médecin).

## Agenda (défense en profondeur)

Même relation 1:1 médecin ↔ cabinet aujourd’hui :

1. `assertDoctorAgendaAccess` : `doctorId` autorisé **et** `DoctorSpace.id === JWT.doctorSpaceId`
2. `listDoctorDay` / `listDoctorWeek` : `appointmentWhereForCabinetAgenda(doctorId, doctorSpaceId, …)`
3. `listForUser` (médecin / secrétaire) : `doctorId` + `doctorSpaceId`
4. `assertCanReadAppointment` : si `appointment.doctorSpaceId` est renseigné, il doit correspondre au JWT

## Exceptions documentées

### Admin

- Pas de `resolveStaffDoctorSpaceId` : listes globales, timeline complète, création de note possible sans JWT cabinet (espace déduit du RDV si fourni).
- À réserver au back-office ; ne pas exposer côté UI médecin.

### Patient (vue agrégée)

- `listForUser` / timeline : filtre `patientId` uniquement — le patient voit tous ses cabinets.
- Prise de RDV public / recherche médecin : crée un accès `PatientDoctorAccess` au cabinet cible.

### Public

Sans JWT :

- Recherche médecins / spécialités / profils publics (`/doctors/search`, vitrine).
- Pas d’accès dossier, agenda, ni messages.

### Stagiaire

- Même filtre lecture que le staff sur patients / timeline / imagerie pédagogique.
- **Interdit** : écriture `MedicalRecord`, création RDV, messagerie clinique (contrôles rôle en plus du tenant).

## Vérification manuelle rapide

1. Deux cabinets seed avec le même patient lié aux deux.
2. Connexion médecin cabinet A → timeline et notes **sans** données du cabinet B.
3. Connexion patient → timeline agrégée des deux.
4. Agenda jour : uniquement RDV du `doctorSpaceId` JWT même si `doctorId` est correct.
