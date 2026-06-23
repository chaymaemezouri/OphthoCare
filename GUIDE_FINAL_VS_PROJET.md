# Synthèse : `final_guide` (OphthoCare v3.0) vs état actuel du dépôt

**Date de rédaction :** 14 mai 2026  
**Sources :** `final_guide` (vision cible), `PHASES.md` (suivi interne), schéma Prisma `Backend/prisma/schema.prisma`, modules Nest/Next du workspace.

Ce document indique **ce qui est déjà en place dans le code** par rapport au guide maître, **où le guide et la réalité divergent**, et **ce qu’il reste à faire** pour se rapprocher de la vision v3.0 (priorités alignées sur le tableau de bord en fin de `final_guide`).

---

## 1. Écarts importants : guide v3.0 ≠ implémentation actuelle

| Sujet (final_guide) | État dans le projet actuel |
|---------------------|----------------------------|
| **7 rôles** dont `SUPER_ADMIN` | Enum Prisma `UserRole` : `admin`, `doctor`, `patient`, `secretary`, `trainee` — **pas** de `SUPER_ADMIN` séparé. |
| **Multi-tenant `DoctorSpace` + `doctorSpaceId` sur toutes les requêtes** | Pas de modèle `DoctorSpace` ; isolation surtout par **lien médecin–patient via rendez-vous** (`assertCanAccessPatient`, `doctorId` sur `Appointment`, etc.). |
| **Redis / sessions / BullMQ** dans le backend | `Backend/docker-compose.yml` inclut **Redis**, mais **aucune** référence `RedisModule` / `BullMQ` / files d’attente dans `Backend/src` (recherche effectuée). Redis est une **dépendance d’infra prête**, pas encore **câblée** à l’app Nest. |
| **PDF Puppeteer + S3 obligatoire + jobs async** | Variables S3 possibles dans `.env.example` ; **pas** de pipeline PDF/BullMQ/WebSocket décrit dans le guide pour les documents. |
| **Socket.io, Twilio SMS prod, FCM, Orthanc DICOM, OCR** | Non présents comme modules applicatifs complets (hors simulation OTP 2FA en logs). |
| **Next.js 14** (guide) | Projet frontend sur **Next.js 16** (App Router), conforme aux règles du repo. |
| **Phase 2-BIS.1 « dossier multi-spécialités complet »** marquée **❌ à faire** dans le guide | `PHASES.md` coche une grande partie du **§2.6 dossier** (MedicalRecord, templates, timeline, import, versioning). **Écart sémantique :** le guide exige en plus une entité **`Consultation`** dédiée, **comparaison** de consultations, **chrono** consultation, **renderer** de formulaires dynamiques par `SpecialtyField[]`, seeds riches par spécialité — tout n’est **pas** au niveau du guide. |

**Conclusion :** le `final_guide` décrit une **cible produit** plus large que le MVP actuel. `PHASES.md` reflète mieux le **MVP web** déjà codé ; ce fichier croise les deux.

---

## 2. Déjà réalisé (fonctionnel ou partiellement) — inventaire par domaine

### 2.1 Fondations & outillage

- Monorepo / backend **NestJS** + **Prisma** + **PostgreSQL** + migrations.
- **Swagger** API (`/api`), validation **class-validator** sur les DTOs, guards **JWT + rôles**.
- **Docker Compose** (PostgreSQL, Redis, Adminer, Redis Commander) — voir §1 pour Redis non branché au code.
- Documentation projet (`README.md`, `STARTUP_GUIDE.md`, `DEVELOPMENT_GUIDE.md`, `PHASES.md`, etc.).

### 2.2 Authentification & utilisateurs

- Inscription / connexion / refresh / logout ; **2FA SMS** (OTP, simulation logs) ; **mot de passe oublié / reset**.
- RBAC : `JwtAuthGuard`, `RoleGuard`, décorateur `@Roles`.
- CRUD utilisateurs côté admin (`POST /users` réservé admin), `GET/PATCH /users/me`.

### 2.3 Médecins & annuaire

- Modèle **Doctor** (profil, spécialité, tarifs, horaires, multi-sites `practiceSites`, photo, `slotDurationMinutes`, etc.).
- **Recherche médecins** : Prisma + **Elasticsearch optionnel** (`ELASTICSEARCH_URL`, repli SQL, réindex admin).
- Pages publiques : recherche, carte, fiche médecin, réservation.
- API médecin connecté : `me`, agenda, blocs d’absence, ICS import/export, sync calendrier **stub**, etc.

### 2.4 Patients

- Modèle **Patient** lié à `User`, données administratives / `medicalData` / **diagnostics CIM-10 JSON** / couverture (CNSS, AMO, mutuelle, etc.).
- `GET/PUT /patients/me` ; staff : `GET /patients/:id`, `PATCH .../dossier`, contrôle d’accès selon RDV.
- **Lookup** patients pour agenda / secrétaire.
- Inscription patient avec `patientProfile` (frontend + API).

### 2.5 Rendez-vous & agenda

- Modèle **Appointment** (statuts, types, chevauchements, etc.).
- Disponibilités, multi-médecins, créneaux selon durée médecin.
- **ScheduleBlock** (absences / fermetures).
- Notifications : **service** avec webhook / journal (pas équivalent complet « multicanal » du guide).

### 2.6 Dossier médical & clinique (cœur MVP)

- **`MedicalRecord`** + `structuredData` JSON, `specialtyCode`, liaison RDV optionnelle.
- **`MedicalRecordVersion`** + **`PatientMedicalAudit`** (traçabilité des fusions / imports dossier).
- Templates **ophtalmologie** + **générique** ; `GET /clinical-records/templates/:code` ; champs spécialité en base (`Specialty.defaultFields`).
- **Timeline** médecin/patient (RDV + enregistrements cliniques + audits).
- **`POST /clinical-records`**, **`PATCH /clinical-records/:id`**, import dossier, liste par patient.
- **`GET /clinical-records/mine`** : documents rédigés par le **médecin connecté** (utilisé par l’UI « ordonnances » comme liste d’entrées cliniques).

### 2.7 Seeds & démo

- **`npm run seed`** : spécialités (fichier seed, ~18 entrées), **médecin + patient démo**, RDV démo, mot de passe démo documenté ailleurs.

### 2.8 Dashboard médecin — pages récemment alignées données réelles

- **Patients** : `GET /doctors/me/patients` (patients ayant un RDV avec le médecin) + UI liste.
- **Consultations** : plage de dates + `GET /doctors/me/appointments` + file du jour / historique.
- **Ordonnances** : liste branchée sur les **entrées cliniques auteur** (`/clinical-records/mine`) — **pas** encore module PDF/ordonnance légale du guide.

### 2.9 Frontend général

- App Router, **Tailwind**, composants type **shadcn**, layouts **dashboard** par rôle (médecin, patient, secrétaire, stagiaire, admin partiel).
- Client API centralisé, auth stockage tokens, plusieurs parcours protégés.

---

## 3. Partiellement fait ou « squelette seulement »

| Domaine | Fait | Manque vs final_guide |
|--------|------|-------------------------|
| **Dossier multi-spécialités** | Templates + JSON + plusieurs `specialty` en seed | Entité **Consultation** séparée, **formulaire dynamique** complet (Zod généré), **comparaison** de deux entrées, **import pré-consultation** lié questionnaire, seeds détaillés **toutes** spécialités listées au guide |
| **Notifications** | Webhook / log | Email SMTP massif, SMS Twilio, FCM, centre de notif UI, **BullMQ** |
| **Admin** | Rôle `admin`, routes protégées | Dashboard admin **aveugle médical** complet, modération avis, métriques, gestion spécialités avancée (comme §5-BIS du guide) |
| **Secrétaire / stagiaire** | Rôles + UI routes | Attache explicite **`doctorSpaceId`**, permissions fines du guide (ex. secrétaire sans IA médicale) |
| **S3** | Config .env | Upload systématique fichiers médicaux, URLs signées partout |
| **Audit accès dossier** | `PatientMedicalAudit` sur **éditions** dossier | **Journal de chaque lecture** dossier (IP, action READ) comme exigence globale du guide |
| **Rate limiting** | Throttler Nest (à vérifier finement par route) | Grilles fines (auth 5/min, IA 20/min, etc.) du guide |
| **Chiffrement champs sensibles** | Données en base | AES-256 sur `nationalId` / assurance comme règle §2 du guide |

---

## 4. Non réalisé — aligné sur les priorités du `final_guide`

### Priorité 1 — Phase **2-BIS** (complétion MVP « document guide »)

1. **2-BIS.1** Dossier patient **multi-spécialités « complet »** : entité Consultation, endpoints liste/comparaison/close/import pré-consultation, UI `SpecialtyFormRenderer`, courbes pédiatriques, etc.
2. **2-BIS.2** **PDF** : BullMQ + Puppeteer + S3 + QR `/public/verify/...` + numérotation par espace médecin.
3. **2-BIS.3** **Messagerie** interne cabinet ↔ patient (threads, pièces jointes, notifications).

### Priorité 2 — **Phase 3** + **Phase 3-BIS**

- Apps **Flutter** patient & médecin, **téléconsultation** (WebRTC / Daily.co).
- **Notifications multicanal** (email, SMS, push, in-app + file d’attente).
- **3-BIS** : membres famille, **avis + modération + badges**, questionnaire pré-consultation, suivi chronique, parcours de soins / référence, **i18n FR/AR/EN + RTL**, devises & export compta, **liste d’attente** automatique.

### Priorité 3 — **Phase 4-BIS**

- **IA** complète (OpenAI, SSE, quiz, résumés, garde-fous disclaimer partout).
- **DICOM** (Orthanc, viewer, comparaison, annotations).
- **OCR** (Tesseract / Azure).

### Priorité 4 — **Phase 5-BIS** + **6-BIS** + **Phase 7**

- Dashboard **admin** global + **analytics** avancés médecin/plateforme.
- **Webhooks** signés + **API ouverte** + clés API + doc publique.
- **Agenda intelligent**, **signature électronique** avancée + consentements, **comparateur** médecins.

### Priorité 5 — **Phase 8** (qualité & production)

- Couverture **tests** (Jest backend, Vitest/Playwright frontend, **k6** charge).
- **Audit sécurité**, RGPD, pen-test, durcissement JWT/uploads/IDOR.
- **CI/CD** complet, monitoring **Sentry**, backups DB → S3, infra prod (Nginx, SSL, etc.).

---

## 5. Tableau récapitulatif (phases du guide ↔ ce dépôt)

| Phase (final_guide) | Statut dans ce dépôt (synthèse) |
|---------------------|--------------------------------|
| **Phase 1** Architecture | **Partiel à fort** : Nest/Prisma/Postgres/Swagger OK ; Redis en compose **sans** intégration Nest ; pas BullMQ/Winston explicites comme dans le guide. |
| **Phase 2.1–2.5** MVP core | **Largement OK** (auth, médecins, recherche, patients, RDV/agenda). |
| **Phase 2.6** Dossier base | **OK MVP** (voir `PHASES.md` §2.6) ; **pas** au niveau « 2-BIS.1 complet » du guide. |
| **Phase 2-BIS** | **Globalement à faire** (sauf briques déjà couvertes par MedicalRecord). |
| **Phases 3 → 8** | **Non réalisées** au sens du guide (mobile, messagerie, PDF, IA, DICOM, admin avancé, prod, tests massifs). |

---

## 6. Prochaines étapes recommandées (ordre pragmatique)

1. **Décider** si le produit continue sur le modèle **actuel** (MedicalRecord + RDV) ou si l’on **introduit** `DoctorSpace` + entité `Consultation` comme dans le guide (impact gros sur schéma et endpoints).
2. **Phase 2-BIS.2** minimal : un premier **PDF** (ordonnance ou compte-rendu) + stockage fichier, même sans BullMQ au début, puis migration vers files d’attente.
3. **Phase 2-BIS.3** messagerie : modèle `Message`/`Thread` + API + UI secrétaire/médecin/patient.
4. **Renforcer** admin (sans données médicales) + **3-BIS.2** avis pour boucle confiance / recherche.
5. Ensuite **3-BIS.6** i18n et **Phase 8** tests/CI pour industrialiser.

---

## 7. Fichiers utiles pour la suite du suivi

- Vision cible détaillée : **`final_guide`**
- Suivi interne cohérent avec le code : **`PHASES.md`**
- Modèle de données : **`Backend/prisma/schema.prisma`**
- API : **`http://localhost:3001/api`** (Swagger)

*Ce document ne remplace pas le `final_guide` : il en est une lecture critique par rapport au dépôt OphthoCare à la date indiquée.*
