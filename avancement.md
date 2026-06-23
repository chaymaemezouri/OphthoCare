# Avancement OphthoCare

Document de **bilan et d’orientation** : ce qui est **réellement** dans le dépôt à ce stade, pour enchaîner sur d’autres chantiers sans relire tout le code.

*Dernière mise à jour : mai 2026.*

---

## 1. Vue d’ensemble

| Zone | Stack | Rôle |
|------|--------|------|
| `frontend/` | Next.js 16 (App Router), React 19, Tailwind, axios, next-auth | UI patient / médecin / secrétaire / stagiaire / admin |
| `Backend/` | NestJS 10, Prisma 6, PostgreSQL, Redis, BullMQ | API REST, auth JWT, métier |
| `Backend/prisma/` | Schéma + migrations SQL | Données |

Le dépôt est un **monorepo** : pas de `package.json` à la racine ; installer et lancer **séparément** `frontend/` et `Backend/`.

---

## 2. Arborescence utile (simplifiée)

```
OphthoCare/
├── avancement.md              ← ce fichier
├── README.md                  ← vue produit (parfois plus “roadmap” que le code)
├── AGENTS.md, CLAUDE.md       ← règles agents / Next
├── PHASES.md, guide*, *_GUIDE*.md, STATUS_REPORT.md, etc.  ← documentation historique / specs
├── frontend/
│   ├── src/app/               ← routes (public), dashboard/*, api/auth
│   ├── src/components/      ← UI, layout, medical/* (formulaires, graphes)
│   ├── src/lib/               ← api client, auth, medical (zod, types)
│   └── package.json
└── Backend/
    ├── prisma/schema.prisma   ← source de vérité données
    ├── prisma/migrations/     ← historique SQL
    ├── src/modules/           ← domaines Nest (un dossier = un module)
    ├── src/database/seeds/    ← seeds (spécialités, démo)
    └── package.json
```

---

## 3. Backend — modules Nest (`Backend/src/app.module.ts`)

| Module | Rôle principal |
|--------|----------------|
| **Auth** | Login, refresh, JWT, 2FA SMS (challenge), mot de passe oublié |
| **Users** | Profils utilisateur |
| **Doctors** | Profil médecin, sites, horaires, tarifs, recherche, ICS, agenda côté praticien |
| **DoctorsSpace** (dans doctors) | Espace cabinet multi-tenant, bootstrap sites |
| **Patients** | Dossier patient, accès `PatientDoctorAccess`, consentements, audits |
| **Specialties** | Liste spécialités, détail par `code`, **template** `GET /specialties/:code/template`, admin POST/PATCH |
| **Appointments** | RDV, statuts, créneaux, blocages, rappels BullMQ, lock Redis |
| **Notifications** | Événements (email/SMS selon config) |
| **MedicalRecords** | Entrées `clinical-records` (dossier clinique historique), versioning |
| **Consultations** | **Nouveau** flux consultation dédié (voir §5) |
| **Documents** (Sem 21–22) | `POST /prescriptions`, `POST /receipts`, `POST /reports`, PDF BullMQ, `GET /public/verify/:type/:uuid`, export ZIP / Excel |
| **Messagerie** (Sem 23–24) | `GET/POST /messaging/*`, WebSocket `/chat`, `MessagingPanel`, badge unread |

Transversal : `PrismaModule`, garde `JwtAuthGuard` / `RoleGuard`, `DoctorSpaceGuard`, pipe de validation custom (`AppValidationPipe`), crypto pièce d’identité patient. **Isolation cabinet** : voir `Backend/docs/MULTI_TENANT.md` (`doctor-space-scope.ts`, filtre timeline / `MedicalRecord` / agenda).

---

## 4. Modèle de données Prisma (entités principales)

Référence : `Backend/prisma/schema.prisma`.

- **Identité / accès** : `User`, `RefreshToken`, `PasswordResetToken`, `AuthOtpChallenge`
- **Référentiel** : `Specialty` (`specificFields`, `examTypes`, `defaultFields` legacy)
- **Médecin / cabinet** : `Doctor`, `DoctorSpace`, `DoctorSite`, `SiteWorkingHour`, `Tariff`, `ScheduleBlock`
- **Liaisons staff** : `SecretaryDoctorSpace`, `TraineeDoctorSpace`
- **Patient** : `Patient`, `PatientDoctorAccess`, `PatientConsent`
- **Agenda** : `Appointment` (lien optionnel `preConsultationFormId` → formulaire)
- **Pré-consultation** : `PreConsultationForm`
- **Consultation MVP 2-BIS** : `Consultation`, `ConsultationReceipt`
- **Documents PDF** : `Prescription`, `PaymentReceipt` (n° `YYYY-NNNNN`), `Medication`, `MedicalReport` (+ champs `pdfUrl`, `verificationUuid`, `shareToken`)
- **Dossier clinique (historique)** : `MedicalRecord`, `MedicalRecordVersion`, `PatientMedicalAudit`

Enums notables : `UserRole` (admin, **super_admin**, doctor, patient, secretary, trainee), `AppointmentStatus`, `ConsultationStatus`, `PlatformAuditAction`, etc.

**Migration récente agenda + consultations** : dossier `Backend/prisma/migrations/20260516020000_phase_2bis_consultations/` (à appliquer sur chaque base si ce n’est pas déjà fait).

---

## 5. API — surfaces importantes (non exhaustif)

### Auth
- `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`, reset password, OTP 2FA…

### Consultations (nouveau)
- `POST /consultations` — création (médecin), statut `in_progress`, `startAt`
- `GET /consultations/:id` — lecture (médecin, secrétaire, stagiaire, patient concerné, admin)
- `PATCH /consultations/:id` — mise à jour (médecin, admin)
- `POST /consultations/:id/close` — clôture + durée + **reçu** (`ConsultationReceipt`)
- `POST /consultations/:id/import-pre-consultation` — import questionnaire
- `GET /consultations/compare?id1=&id2=` — diff (médecin, même patient / espace)
- `GET /consultations/vitals-timeline?patientId=` — série pour graphiques constantes

### Spécialités
- `GET /specialties`, `GET /specialties/:code`, `GET /specialties/:code/template`
- `POST /specialties`, `PATCH /specialties/:id` — **admin**

### Dossier clinique (existant)
- Préfixe contrôleur : `clinical-records` — liste, création, versions, import dossier…

### Patients, médecins, RDV
- Voir contrôleurs `patients`, `doctors`, `appointments` (nombreux endpoints agenda, secrétaire, etc.).

**Swagger** : activé côté Nest si configuré dans `main.ts` (à vérifier en local).

---

## 6. Frontend — ce qui existe

### Routes dashboard (extraits de `frontend/src/app/dashboard/`)
- **Médecin** : accueil, agenda, patients, consultations (page liste/UI), ordonnances, analytics, comm, téléconsultation, machines, IA, gestion, réglages (profil, sites, tarifs)…
- **Patient** : accueil, RDV (`/book`, `/dashboard/patient/bookings`), **reprogrammation** (`bookings/[id]/reschedule`), **pré-consultation**, **téléconsultation** (`teleconsult/[appointmentId]`), **notifications in-app** (cloche + `/dashboard/patient/notifications`), consultations, documents, reçus, dossier médical, profil…
- **Secrétaire** : agenda, patients, gestion, comm, réglages…
- **Stagiaire** : clinique, bibliothèque…
- **Admin (Sem 43–44)** : vue d’ensemble KPI + graphiques (`/dashboard/admin`), **médecins** (certifier / suspendre / stats anonymes / CSV), **spécialités**, **sécurité & audit** (logs hachés, échecs login, sessions révocables), **modération avis**, maintenance. API `GET/PATCH /admin/*` — **aucun accès au contenu médical** pour `admin` / `super_admin`.
- **Public** : landing refondue (**Care**), tarifs praticiens (MAD) + mail `PRO_CONTACT_EMAIL`, doubles accès patient/pro (`/login?intent=…`), login, register, recherche médecins, réservation `book/[doctorId]`, fiche médecin, **pré-consultation sans login** (`/pre-consultation/[token]`, token `PreConsultationForm.publicToken`)…

### Composants médicaux récents (`frontend/src/components/medical/`)
- `SpecialtyFormRenderer.tsx` — formulaire dynamique + Zod
- `DoctorConsultationWorkspace.tsx` — parcours médecin (brouillon `draft` → `POST …/start` → `in_progress` → close ; template / import pré-consult / compare)
- `VitalSignsTimeline.tsx` — Recharts + plages normales + alertes
- `ConsultationComparison.tsx` — comparaison deux consultations
- `GrowthCurveChart.tsx` — courbes WHO (P3–P97) : poids / taille / PC, garçon & fille 0–24 mois (`who-growth-data.ts`)
- `patient-medical-sidebar.tsx`, `medical-records.tsx` — existants

### Client API
- `frontend/src/lib/api/client.ts` — axios + tokens
- `frontend/src/lib/api/consultations.ts` — helpers consultations / template
- `frontend/src/lib/constants/api-endpoints.ts` — constantes d’URL

**Dossier médecin** : onglet **Note clinique** redirige vers **Consultation** ; à la clôture, sync `MedicalRecord` via `consultation-clinical-mapper` (ophtalmo + champs génériques).

**À noter** : certaines pages dashboard restent à enrichir (analytics déjà branché) ; le parcours consultation médecin est opérationnel dans le dossier patient + agenda.

---

## 7. Seeds & démo

- `Backend/src/database/seeds/run-seeds.ts` + `demo-data.seed.ts` : spécialités, médicaments, **9 comptes** (médecin ophtalmo + cardio, secrétaire, stagiaire, 5 patients, admin, super_admin), agenda complet, consultations, dossier, ordonnances/reçus/CR, messagerie, notifications patient, imagerie & quiz stagiaire, modération avis, audit admin.
- Référence comptes : `Backend/docs/DEMO_ACCOUNTS.md` — mot de passe unique `OphthoDemo2024!`.

---

## 8. Documentation dispersée (index rapide)

| Fichier | Usage |
|---------|--------|
| `README.md` | Vue produit / phases (à garder aligné avec `avancement.md`) |
| `PHASES.md` | Plan de phases détaillé |
| `PROJECT_STRUCTURE.md`, `DEVELOPMENT_GUIDE.md`, `STARTUP_GUIDE.md` | onboarding |
| `STATUS_REPORT.md`, `EXECUTIVE_SUMMARY.md` | reporting |
| `GUIDE_FINAL_VS_PROJET.md` | écart spec / implémentation |
| `frontend/README.md`, `frontend/STRUCTURE.md`, `frontend/DEVELOPMENT.md` | front |
| `Backend/README.md`, `Backend/QUICKSTART.md` | API |

Recommandation : pour toute **nouvelle** doc métier, soit mettre à jour **ce fichier** (`avancement.md`), soit un seul `docs/` plus tard pour éviter la dilution.

---

## 9. Prochaines étapes suggérées (hors “nettoyage”)

1. **Tests E2E** : pré-consult public, cycle consultation, génération PDF + scan QR verify.
2. **Prod** : configurer `AWS_*` + `REDIS_HOST` + `PUBLIC_APP_URL` / `API_PUBLIC_URL` pour PDF et liens signés.
2. **Parcours patient** : affiner liste consultations / reçus si besoin produit.
3. **Données WHO** : remplacer les tables simplifiées par les courbes officielles si exigence réglementaire.
4. **Stagiaire** : création des lignes `TraineeDoctorSpace` (données + éventuellement UI admin).
5. **Tests** : e2e critiques (auth, création RDV, clôture consultation).
6. **Aligner** `README.md` / `PHASES.md` avec la réalité du code (beaucoup de cases encore `[ ]` dans `PHASES.md` alors que le socle existe).

---

## 10. Commandes utiles

```bash
# Backend
cd Backend && npm install && npx prisma migrate deploy && npx prisma generate && npm run start:dev

# Seeds
cd Backend && npm run seed

# Frontend
cd frontend && npm install && npm run dev
```

---

*Fin du fichier `avancement.md` — à mettre à jour à chaque livraison majeure.*
