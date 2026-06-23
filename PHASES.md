# PLAN DE PHASES DE DÉVELOPPEMENT

## Stratégie générale

Le projet sera développé en **6 phases** de 4-8 semaines chacune, avec un **MVP opérationnel** à la fin de la Phase 2.

```
PHASE 1: Architecture & Setup (4-6 sem)
    ↓
PHASE 2: MVP Core (10-14 sem) ← PRODUIT VIABLE
    ↓
PHASE 3: Mobile & Communication (8-10 sem)
    ↓
PHASE 4: IA & Intégrations (8-12 sem)
    ↓
PHASE 5: Enrichissement (6-8 sem)
    ↓
PHASE 6: Tests & Production (4-6 sem)
```

---

## PHASE 1 : ARCHITECTURE & SETUP (Semaines 1-6)

### Objectif
Construire les fondations : infrastructure, architecture technique validée, environnement de développement, templates et structure de code.

### Livrables

#### 1.1 Backend Setup (NestJS)
- [ ] Initialiser projet NestJS avec authentification (Passport + JWT)
- [ ] Configurer PostgreSQL avec TypeORM/Prisma
- [ ] Mettre en place Redis pour cache/sessions
- [ ] Configurer logging centralisé (Winston)
- [ ] Setup docker-compose (backend + DB + Redis)
- [ ] Middleware CORS, rate limiting, security headers
- [ ] Structure modulaire de base (auth, users, common)
- [ ] Tests unitaires setup (Jest)

#### 1.2 Frontend Restructuration
- [ ] Refactoriser structure Next.js existante
- [ ] Setup Zustand/Redux pour état global
- [ ] Configurer axios/fetch interceptors
- [ ] Types TypeScript exhaustifs (User, Doctor, Patient, etc.)
- [ ] Service layer pour API calls
- [ ] Tailwind configuration finalisée + dark mode
- [ ] Setup des routes protégées avec middleware d'authentification
- [ ] Composants de base refactorisés (Button, Card, Form, etc.)

#### 1.3 Base de Données
- [ ] Concevoir schéma PostgreSQL complet (ERD)
- [ ] Créer migrations pour entités principales
- [ ] Seed database avec spécialités et données demo
- [ ] Documenter relations et contraintes

#### 1.4 API Specification
- [ ] Écrire OpenAPI/Swagger complète
- [ ] Documenter endpoints par module
- [ ] Définir codes d'erreur standardisés
- [ ] Exemples requêtes/réponses

#### 1.5 Documentation
- [ ] ARCHITECTURE.md – Stack & patterns
- [ ] DATABASE.md – Schéma & relations
- [ ] API_SPEC.md – Tous endpoints
- [ ] DEVELOPMENT.md – Guide setup local
- [ ] CONTRIBUTING.md – Standards code

### Délai: **6 semaines**
### Équipe: 1-2 devs backend + 1 dev frontend + 1 architect

---

## PHASE 2 : MVP CORE (Semaines 7-20)

### Objectif
Livrer un produit minimal viable : annuaire, prise RDV, gestion patient, consultations, documents.

### Modules à Développer (dans l'ordre)

#### 2.1 Authentification & Utilisateurs (Sem 7-8)
**Backend:**
- [x] Routes auth: register, login, logout, refresh token (`/auth/*`, JWT access + refresh)
- [x] 2FA SMS optional (OTP challenge + activation routes)
- [x] Password reset flow (forgot / reset + jeton)
- [x] User service (CRUD profils, `PATCH /users/me`, admin `POST /users`)
- [x] Role-based access control (RBAC) (guards + `@Roles`)

**Frontend:**
- [x] Page login/register (+ étape 2FA, mot de passe oublié / reset)
- [x] Protected routes middleware (`withAuth` sur `/dashboard/*`, `/account`)
- [x] Auth store (Zustand) + sync session dans `useAuth`
- [x] User profile management (`/account` → `usersApi.patchMe`)
- [x] Logout & token refresh (`authApi.logout`, client refresh, NextAuth)

#### 2.2 Module Médecins (Sem 9-10)
**Backend:**
- [x] Entité Doctor + relations
- [x] CRUD opérations
- [x] Profil public (bio, spécialités, horaires)
- [x] Upload photo profil
- [x] Tarifs et horaires configurables
- [x] Multi-site support (cabinet 1, cabinet 2, etc.)

**Frontend:**
- [x] Page profil médecin (édition)
- [x] Formulaire spécialités/horaires/tarifs
- [x] Importateur horaires (calendar sync)
- [x] Dashboard médecin accueil

#### 2.3 Module Annuaire & Recherche (Sem 11-12)
**Backend:**
- [x] Elasticsearch intégration (`ELASTICSEARCH_URL` optionnel ; repli Prisma si absent ou indisponible)
- [x] Indexation médecins (nom, spécialité, localisation, tarif, note, vérif.) — sync à la création / mise à jour / suppression ; `POST /doctors/search/reindex` (admin)
- [x] Search API: par spécialité, ville, texte `q`, disponibilité (`availableOn=YYYY-MM-DD`), pagination `skip`/`take`
- [x] Filtrage avancé (`minRating`, `maxPrice`, `isVerified`) — ES + Prisma ; réponse `{ items, total, usedElasticsearch }`

**Frontend:**
- [x] Page d'accueil landing page (composant `SiteLanding`)
- [x] Barre de recherche "Spécialité + Ville" (hero + `/search`)
- [x] Page résultats avec filtres (`/search`, URL query, sidebar filtres)
- [x] Carte interactive (Leaflet / OpenStreetMap, `react-leaflet`, chargement dynamique sans SSR)
- [x] Cartes profil médecin (`DoctorCard` : photo, note, ville, tarif, lien fiche / réservation)
- [x] Détail médecin public (`/doctor/[id]`)

#### 2.4 Module Patients (Sem 13-14)
**Backend:**
- [x] Entité Patient + relations
- [x] CRUD patient (soi : `GET|PUT /patients/me` ; staff : `GET|PATCH|DELETE /patients/:id` ; liste admin `GET /patients`)
- [x] Données médicales de base (identité, allergies, antécédents) — `medicalData` JSON + champs profil
- [x] CIM-10 codes (diagnostics) — `diagnoses` JSON validé (`PatientDiagnosisDto`)
- [x] Couverture sociale (CNSS, AMO, mutuelle) — champs dédiés + `insuranceProvider` / `insuranceNumber` / `coverageNotes`

**Frontend:**
- [x] Patient registration flow — inscription en 2 étapes + `patientProfile` à l’API
- [x] Profil patient (édition) — `/dashboard/patient/profile` + persistance locale / API
- [x] Champs médicaux de base — profil + page dossier (`MedicalDataEditor` / timeline API)
- [x] Historique médecins — dérivé des rendez-vous (API ou données démo)

#### 2.5 Module Rendez-vous / Agenda (Sem 15-18)
**Backend:**
- [x] Entité Appointment + relations
- [x] Booking service (validations, disponibilité)
- [x] Statuts: pending, confirmed, completed, cancelled
- [x] Calendar service (Google/Outlook sync) — export ICS médecin + stub OAuth `POST /doctors/me/calendar-sync` ; import horaires ICS existant
- [x] Notification service (email confirmations, rappels) — `NotificationsService` (webhook `NOTIFICATION_WEBHOOK_URL` ou journal) + rappel `POST /appointments/doctor/:id/remind`
- [x] TimeSlot generation (30min, 45min, 1h slots) — `slotDurationMinutes` médecin (15–120) + grille disponibilité
- [x] Multi-doctor availability — `GET /doctors/availability-multi`
- [x] Gestion absentéisme + fermetures — modèle `ScheduleBlock` + API médecin

**Frontend (Médecin):**
- [x] Vue calendrier (jour/semaine/mois)
- [x] Drag & drop appointments
- [x] Coloration par statut/type
- [x] Détail appointment popup
- [x] Fusion/split consultations
- [x] Absence marking

**Frontend (Patient):**
- [x] Booking widget étape par étape
- [x] Sélection créneau horaire
- [x] Confirmation et récapitulatif
- [x] Gestion mes RDV (liste, lien recherche ; annulation branchée API)
- [x] Notifications/rappels — côté patient : confirmations à la réservation côté serveur ; préférences / push = `NOTIFICATION_WEBHOOK_URL` (documenté)

#### 2.6 Module Dossier Patient (Sem 19-20)
**Backend:**
- [x] Entité MedicalRecord + champs structurés (`structuredData` JSON, liaison RDV optionnelle)
- [x] Templates par spécialité (`GET /clinical-records/templates/:code` + `Specialty.defaultFields` + gabarits ophthalmo / générique)
- [x] Versioning du dossier (`MedicalRecordVersion` + `PatientMedicalAudit` pour fusion dossier / import)
- [x] Champs ophtalmologie (acuité visuelle, PIO, réfraction, segment antérieur, fond d’œil — formulaire médecin)
- [x] Généralisable à autres spécialités (`specialtyCode`, `extensions` dans structuredData, template générique)

**Frontend:**
- [x] Sidebar patient data (identité, allergies, etc.) — `PatientMedicalSidebar` + colonne médecin
- [x] Historique consultations — timeline fusionnée RDV + audits
- [x] Timeline médicale — `UnifiedMedicalTimeline` (RDV, notes cliniques, journaux dossier)
- [x] Import données existantes — JSON → `POST /clinical-records/import/:patientId`
- [x] Édition dossier par médecin — notes cliniques + `PATCH /patients/:id/dossier` + versions

### Délai: **14 semaines**
### Équipe: 2 devs backend + 2 devs frontend + 1 QA

### Sortie Phase 2 : MVP opérationnel
- Annuaire fonctionnel
- Patients peuvent prendre RDV
- Médecins gèrent agenda et dossiers
- Authentification sécurisée
- Déploiement sur serveur de test

---

## PHASE 3 : MOBILE & COMMUNICATION (Semaines 21-30)

### Objectif
Étendre à mobile native + notifications multicanal.

#### 3.1 Application Mobile Patient (Sem 21-23)
- [ ] Setup Flutter
- [ ] Login/register
- [ ] Recherche médecins
- [ ] Booking appointments
- [ ] Mes rendez-vous
- [ ] Historique consultations
- [ ] Questionnaire pré-consultation

#### 3.2 Application Mobile Médecin (Sem 24-25)
- [ ] Dashboard compact
- [ ] Consultations du jour
- [ ] Dossier patient consultable
- [ ] Mode hors ligne
- [ ] Sync données

#### 3.3 Notifications Multicanal (Sem 26-27)
**Backend:**
- [ ] Email (SMTP + templates)
- [ ] SMS (Twilio / OVH)
- [ ] Push FCM (Firebase Cloud Messaging)
- [ ] In-app notifications
- [ ] Bull Queue pour job async

**Frontend:**
- [ ] Push notification handling
- [ ] Notification center
- [ ] Preference management

#### 3.4 Téléconsultation (Sem 28-30)
- [ ] WebRTC intégration (ou Daily.co)
- [ ] Salle d'attente
- [ ] Chat textuel
- [ ] Screen sharing
- [ ] Recording optionnel

### Délai: **10 semaines**
### Équipe: 2 devs mobile + 1 dev backend (notifications)

---

## PHASE 4 : IA & INTÉGRATIONS (Semaines 31-42)

### Objectif
Ajouter intelligence artificielle et intégrations systèmes médicaux.

#### 4.1 Module IA Assistant (Sem 31-35)
**Backend:**
- [ ] OpenAI API integration
- [ ] Clinical summary generation
- [ ] Diagnostic suggestions (non-prescriptives)
- [ ] Exam explanation
- [ ] Trend analysis
- [ ] Anomaly detection
- [ ] Specialty-specific prompts

**Frontend:**
- [ ] AI chatbot interface
- [ ] Summary display
- [ ] Suggestions visualization
- [ ] Quiz generation from cases

#### 4.2 Intégration Machines Médicales (Sem 36-40)
- [ ] DICOM server (Orthanc)
- [ ] Upload DICOM handling
- [ ] DICOM viewer (Cornerstone.js)
- [ ] Image comparison
- [ ] Auto-indexing
- [ ] HL7/FHIR messages parsing

#### 4.3 Génération Documents (Sem 41-42)
- [ ] Prescription PDF generation
- [ ] Report generation (structuré)
- [ ] Certificate generation
- [ ] Digital signatures
- [ ] QR codes pour authentification

### Délai: **12 semaines**
### Équipe: 1 dev backend (IA) + 1 dev backend (DICOM) + 1 dev frontend

---

## PHASE 5 : ENRICHISSEMENT (Semaines 43-50)

### Objectif
Ajouter features premium et optimisations.

#### 5.1 Questionnaire Pré-Consultation (Sem 43-44)
- [ ] Formulaires dynamiques par spécialité
- [ ] Auto-population dans consultation
- [ ] Validation et alertes

#### 5.2 Système Avis Patients (Sem 45-46)
- [ ] Laisser avis après consultation
- [ ] Modération
- [ ] Affichage profil médecin
- [ ] Badges reputation

#### 5.3 Parcours de Soins Coordonnés (Sem 47-48)
- [ ] Référence vers confrère
- [ ] Génération courrier de référence
- [ ] Suivi multi-spécialités

#### 5.4 Suivi Chronique (Sem 49-50)
- [ ] Marquage patients chroniques
- [ ] Plans de suivi
- [ ] Rappels automatiques
- [ ] Graphiques de suivi

### Délai: **8 semaines**
### Équipe: 1-2 devs par feature

---

## PHASE 6 : TESTS & PRODUCTION (Semaines 51-56)

### Objectif
Validation, sécurité, optimisations, déploiement production.

#### 6.1 Tests Complets (Sem 51-52)
- [ ] Tests unitaires (backend 80%+, frontend 60%+)
- [ ] Tests intégration
- [ ] Tests E2E (Cypress)
- [ ] Tests de charge (k6)
- [ ] Tests d'accessibilité

#### 6.2 Audit Sécurité (Sem 53)
- [ ] Audit code SAST
- [ ] Tests de pénétration
- [ ] Vérification RGPD
- [ ] Chiffrement données
- [ ] 2FA + permissions

#### 6.3 Optimisations (Sem 54)
- [ ] Performance frontend (Core Web Vitals)
- [ ] Optimisation requêtes DB
- [ ] CDN pour assets
- [ ] Compression images

#### 6.4 Déploiement Production (Sem 55-56)
- [ ] Infrastructure cloud (VPS / AWS / Azure)
- [ ] Kubernetes setup (optionnel)
- [ ] CI/CD pipeline (GitHub Actions / GitLab CI)
- [ ] Backup & disaster recovery
- [ ] Monitoring & alerting (Sentry, DataDog)

### Délai: **6 semaines**
### Équipe: DevOps + QA + Backend lead

---

## Chronologie globale

| Phase | Durée | Semaines | Livrable |
|-------|-------|----------|----------|
| **1. Architecture** | 6 sem | 1-6 | Infrastructure prête |
| **2. MVP** | 14 sem | 7-20 | **Produit viable** |
| **3. Mobile + Comm** | 10 sem | 21-30 | App + Notifications |
| **4. IA + Machines** | 12 sem | 31-42 | Intelligence & Intégrations |
| **5. Enrichissement** | 8 sem | 43-50 | Features premium |
| **6. Tests + Prod** | 6 sem | 51-56 | **En production** |
| **TOTAL** | **56 semaines** | ~13 mois | Plateforme complète |

---

## Jalons critiques (gates)

### Gate Phase 1 → Phase 2
- Infrastructure stable
- Architecture validée
- Dev environment prêt

### Gate Phase 2 → Phase 3 (MVP Release)
- Annuaire opérationnel
- Booking 100% fonctionnel
- Dossier patient centralisé
- Aucun bug critique

### Gate Phase 3 → Phase 4
- Applications mobile publiées
- Notifications opérationnelles
- Téléconsultation validée

### Gate Phase 4 → Phase 5
- Assistant IA fonctionnel
- Intégration DICOM opérationnelle
- Génération de documents

### Gate Phase 5 → Phase 6
- Fonctionnalités testées
- Audit sécurité passé
- Performance acceptable

### Gate Phase 6 → Production
- SLA disponibilité 99,5%
- Conformité RGPD
- Sauvegardes testées
- Monitoring en place

---

## Dépendances entre phases

```
Phase 1 (Infra)
    ↓ (MUST complete)
Phase 2 (MVP Core)
    ├─ Phase 3 (Mobile) - CAN start in parallel après sem 15
    ├─ Phase 4 (IA) - START après Phase 2 validation
    └─ Phase 5 (Enrichment) - START après Phase 4
        ↓
    Phase 6 (Tests + Production)
```

---

## Sizing équipe minimum

| Role | FTE | Phase 1-2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|------|-----|----------|--------|--------|--------|---------|
| Backend Lead | 1.0 | oui | oui | oui | oui | oui |
| Backend Dev | 1-2 | oui | oui | oui | oui | oui |
| Frontend Lead | 1.0 | oui | oui | oui | oui | oui |
| Frontend Dev | 1-2 | oui | oui | oui | oui | oui |
| Mobile Dev | - | - | oui | oui | oui | oui |
| DevOps/Infra | 0.5 | oui | - | - | - | oui |
| QA/Tester | 0.5 | - | oui | oui | oui | oui |
| Product/PM | 1.0 | oui | oui | oui | oui | oui |
| **TOTAL** | **~7-8 FTE** | | | | | |

---

## Success metrics par phase

### Phase 2 (MVP)
- 1000+ médecins enregistrés
- 5000+ patients
- 500+ RDV/semaine
- 99% disponibilité

### Phase 3 (Mobile)
- 2000+ téléchargements d’application
- Note moyenne 4,5+ sur les stores

### Phase 4 (IA)
- 95%+ de satisfaction sur le retour IA
- 100% compatibilité DICOM

### Phase 6 (Production)
- 10 000+ médecins
- 100 000+ patients actifs
- 99,5% disponibilité
- Temps de chargement des pages inférieur à 2 s

