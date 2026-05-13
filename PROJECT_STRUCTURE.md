# 📁 STRUCTURE COMPLÈTE DU PROJET OPHTHOCCARE v3.0

## 🎯 Vue d'ensemble organisationnelle

```
OphthoCare/
├── 📘 Documentation/                    # Docs projet
│   ├── CAHIER_DES_CHARGES.md           # CDC complet
│   ├── ARCHITECTURE.md                 # Architecture technique
│   ├── DATABASE.md                     # Modèle données
│   ├── API_SPEC.md                     # Spécification API
│   └── DEPLOYMENT.md                   # Guide déploiement
│
├── 🎨 frontend/                         # Application web React/Next.js
│   ├── public/                         # Assets publics
│   ├── src/
│   │   ├── app/                        # App Router (Next.js)
│   │   │   ├── (public)/               # Routes publiques (layout wrapper)
│   │   │   │   ├── page.tsx            # Landing page
│   │   │   │   ├── search/page.tsx     # Annuaire + recherche médecins
│   │   │   │   ├── doctor/[id]/page.tsx # Profil médecin public
│   │   │   │   ├── login/page.tsx      # Connexion
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/            # Routes protégées (layout dashboard)
│   │   │   │   ├── patient/
│   │   │   │   │   ├── page.tsx        # Dashboard patient
│   │   │   │   │   ├── bookings/page.tsx   # Mes RDV
│   │   │   │   │   ├── medical-records/page.tsx # Dossiers
│   │   │   │   │   └── doctors/page.tsx # Mes médecins
│   │   │   │   ├── doctor/[doctorId]/
│   │   │   │   │   ├── page.tsx        # Dashboard médecin
│   │   │   │   │   ├── calendar/page.tsx    # Agenda
│   │   │   │   │   ├── patients/page.tsx    # Patients
│   │   │   │   │   ├── patient/[patientId]/page.tsx # Dossier patient
│   │   │   │   │   ├── consultation/[consultationId]/page.tsx # Consultation
│   │   │   │   │   ├── prescriptions/page.tsx      # Ordonnances
│   │   │   │   │   ├── documents/page.tsx          # Comptes rendus
│   │   │   │   │   ├── exams/page.tsx              # Examens/DICOM
│   │   │   │   │   ├── ai-assistant/page.tsx       # IA (si médecin)
│   │   │   │   │   ├── telemedicine/page.tsx       # Téléconsultation
│   │   │   │   │   ├── analytics/page.tsx          # Statistiques
│   │   │   │   │   └── settings/page.tsx           # Paramètres
│   │   │   │   ├── secretary/[secretaryId]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── calendar/page.tsx
│   │   │   │   │   ├── reception/page.tsx
│   │   │   │   │   ├── patients/page.tsx
│   │   │   │   │   ├── billing/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   ├── trainee/[traineeId]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── ai-learning/page.tsx
│   │   │   │   │   ├── clinical-cases/page.tsx
│   │   │   │   │   ├── library/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   ├── admin/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── doctors/page.tsx
│   │   │   │   │   ├── users/page.tsx
│   │   │   │   │   ├── security/page.tsx
│   │   │   │   │   └── analytics/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── api/                    # API routes Next.js (proxy → backend)
│   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   ├── doctors/route.ts
│   │   │   │   └── ...
│   │   │   ├── layout.tsx              # Root layout
│   │   │   └── page.tsx                # Redirect logic
│   │   │
│   │   ├── components/                 # Composants réutilisables
│   │   │   ├── layout/
│   │   │   │   ├── dashboard-layout.tsx
│   │   │   │   ├── public-layout.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   └── footer.tsx
│   │   │   ├── ui/                    # shadcn/ui + customs
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   └── ... (20+ components)
│   │   │   ├── search/                 # Annuaire & recherche
│   │   │   │   ├── doctor-search.tsx
│   │   │   │   ├── doctor-filter.tsx
│   │   │   │   ├── doctor-card.tsx
│   │   │   │   ├── doctor-map.tsx
│   │   │   │   └── specialty-picker.tsx
│   │   │   ├── appointments/           # Rendez-vous
│   │   │   │   ├── booking-widget.tsx
│   │   │   │   ├── calendar-picker.tsx
│   │   │   │   ├── time-slot-picker.tsx
│   │   │   │   ├── appointment-list.tsx
│   │   │   │   └── appointment-card.tsx
│   │   │   ├── medical/                # Composants médicaux
│   │   │   │   ├── patient-record.tsx
│   │   │   │   ├── consultation-form.tsx
│   │   │   │   ├── prescription-form.tsx
│   │   │   │   ├── medical-history.tsx
│   │   │   │   ├── exam-viewer.tsx
│   │   │   │   ├── dicom-viewer.tsx
│   │   │   │   ├── vital-signs.tsx
│   │   │   │   └── specialty-template.tsx
│   │   │   ├── ai/                    # Composants IA
│   │   │   │   ├── ai-chatbot.tsx
│   │   │   │   ├── ai-summary.tsx
│   │   │   │   ├── ai-suggestions.tsx
│   │   │   │   ├── ai-learning.tsx
│   │   │   │   └── ai-quiz.tsx
│   │   │   ├── telemedicine/
│   │   │   │   ├── video-call.tsx
│   │   │   │   ├── waiting-room.tsx
│   │   │   │   └── call-controls.tsx
│   │   │   ├── documents/
│   │   │   │   ├── prescription-pdf.tsx
│   │   │   │   ├── report-pdf.tsx
│   │   │   │   └── receipt-pdf.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── charts.tsx
│   │   │   │   ├── statistics.tsx
│   │   │   │   ├── graph-trends.tsx
│   │   │   │   └── reports-export.tsx
│   │   │   └── common/
│   │   │       ├── command-palette.tsx
│   │   │       ├── theme-toggle.tsx
│   │   │       └── notifications.tsx
│   │   │
│   │   ├── hooks/                     # Custom React Hooks
│   │   │   ├── use-auth.ts
│   │   │   ├── use-doctors.ts
│   │   │   ├── use-patients.ts
│   │   │   ├── use-appointments.ts
│   │   │   ├── use-consultations.ts
│   │   │   ├── use-search.ts
│   │   │   ├── use-pagination.ts
│   │   │   ├── use-mobile.ts
│   │   │   └── use-form.ts
│   │   │
│   │   ├── lib/                       # Utilitaires
│   │   │   ├── api/
│   │   │   │   ├── client.ts          # Axios/fetch instance configuré
│   │   │   │   ├── doctors.ts         # API doctors
│   │   │   │   ├── patients.ts        # API patients
│   │   │   │   ├── appointments.ts    # API RDV
│   │   │   │   ├── consultations.ts   # API consultations
│   │   │   │   ├── auth.ts            # API auth
│   │   │   │   └── ... (par module)
│   │   │   ├── utils/
│   │   │   │   ├── date.ts            # Utilitaires dates
│   │   │   │   ├── format.ts          # Formatage
│   │   │   │   ├── validation.ts      # Validation
│   │   │   │   ├── medical.ts         # Utilitaires médicaux
│   │   │   │   └── cn.ts              # classnames helper
│   │   │   ├── constants/
│   │   │   │   ├── specialties.ts     # Spécialités, codes
│   │   │   │   ├── status.ts          # Statuts énumérations
│   │   │   │   ├── messages.ts        # Messages d'erreur
│   │   │   │   └── config.ts          # Constantes config
│   │   │   ├── services/
│   │   │   │   ├── storage.ts         # LocalStorage/SessionStorage
│   │   │   │   ├── auth-service.ts    # Service authentification
│   │   │   │   ├── cache.ts           # Gestion cache
│   │   │   │   └── notification.ts    # Service notifications
│   │   │   └── validators/
│   │   │       ├── doctor.ts
│   │   │       ├── patient.ts
│   │   │       ├── appointment.ts
│   │   │       └── consultation.ts
│   │   │
│   │   ├── store/                     # État global (Zustand ou Redux)
│   │   │   ├── auth-store.ts
│   │   │   ├── user-store.ts
│   │   │   ├── appointment-store.ts
│   │   │   ├── notification-store.ts
│   │   │   └── ui-store.ts
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── animations.css
│   │   │
│   │   └── types/
│   │       ├── index.ts
│   │       ├── user.ts
│   │       ├── doctor.ts
│   │       ├── patient.ts
│   │       ├── appointment.ts
│   │       ├── consultation.ts
│   │       ├── exam.ts
│   │       ├── prescription.ts
│   │       ├── specialty.ts
│   │       └── api.ts
│   │
│   ├── .env.example
│   ├── .env.local
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── package.json
│   └── README.md
│
├── 🔧 backend/                         # API REST NestJS/FastAPI
│   ├── src/
│   │   ├── main.ts (ou main.py)        # Point d'entrée
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/                   # Authentification & JWT
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── local.strategy.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt.guard.ts
│   │   │   │   │   └── role.guard.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-user.dto.ts
│   │   │   │       └── update-user.dto.ts
│   │   │   │
│   │   │   ├── doctors/
│   │   │   │   ├── doctors.controller.ts
│   │   │   │   ├── doctors.service.ts
│   │   │   │   ├── doctors.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── doctor.entity.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-doctor.dto.ts
│   │   │   │   │   ├── update-profile.dto.ts
│   │   │   │   │   └── filter-doctors.dto.ts
│   │   │   │   └── search/
│   │   │   │       ├── doctor-search.service.ts  (Elasticsearch)
│   │   │   │       └── doctor-mapper.ts
│   │   │   │
│   │   │   ├── patients/
│   │   │   │   ├── patients.controller.ts
│   │   │   │   ├── patients.service.ts
│   │   │   │   ├── patients.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── patient.entity.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-patient.dto.ts
│   │   │   │   │   ├── update-patient.dto.ts
│   │   │   │   │   └── patient-medical-data.dto.ts
│   │   │   │   └── medical-records/
│   │   │   │       ├── medical-record.service.ts
│   │   │   │       └── medical-record.entity.ts
│   │   │   │
│   │   │   ├── appointments/
│   │   │   │   ├── appointments.controller.ts
│   │   │   │   ├── appointments.service.ts
│   │   │   │   ├── appointments.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── appointment.entity.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-appointment.dto.ts
│   │   │   │   │   ├── appointment-slot.dto.ts
│   │   │   │   │   └── appointment-search.dto.ts
│   │   │   │   ├── calendar/
│   │   │   │   │   ├── calendar.service.ts  (Google/Outlook sync)
│   │   │   │   │   └── calendar.provider.ts
│   │   │   │   └── notifications/
│   │   │   │       └── appointment-notification.service.ts
│   │   │   │
│   │   │   ├── consultations/
│   │   │   │   ├── consultations.controller.ts
│   │   │   │   ├── consultations.service.ts
│   │   │   │   ├── consultations.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── consultation.entity.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-consultation.dto.ts
│   │   │   │   │   └── update-consultation.dto.ts
│   │   │   │   ├── templates/
│   │   │   │   │   ├── specialty-template.service.ts
│   │   │   │   │   └── templates/ (par spécialité)
│   │   │   │   │       ├── ophthalmology.template.ts
│   │   │   │   │       ├── cardiology.template.ts
│   │   │   │   │       └── ...
│   │   │   │   └── comparison/
│   │   │   │       └── consultation-comparison.service.ts
│   │   │   │
│   │   │   ├── prescriptions/
│   │   │   │   ├── prescriptions.controller.ts
│   │   │   │   ├── prescriptions.service.ts
│   │   │   │   ├── prescriptions.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── prescription.entity.ts
│   │   │   │   ├── dto/
│   │   │   │   │   └── create-prescription.dto.ts
│   │   │   │   ├── generation/
│   │   │   │   │   ├── prescription-pdf.service.ts
│   │   │   │   │   ├── prescription-signature.service.ts
│   │   │   │   │   └── qr-code.service.ts
│   │   │   │   └── medicines/
│   │   │   │       └── medicine-database.service.ts
│   │   │   │
│   │   │   ├── exams/
│   │   │   │   ├── exams.controller.ts
│   │   │   │   ├── exams.service.ts
│   │   │   │   ├── exams.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── exam.entity.ts
│   │   │   │   ├── upload/
│   │   │   │   │   ├── exam-upload.service.ts (S3)
│   │   │   │   │   └── file-validator.ts
│   │   │   │   ├── dicom/
│   │   │   │   │   ├── dicom.service.ts (Orthanc integration)
│   │   │   │   │   ├── dicom-mapper.ts
│   │   │   │   │   └── dicom-comparison.service.ts
│   │   │   │   └── comparison/
│   │   │   │       └── exam-comparison.service.ts
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── documents.controller.ts
│   │   │   │   ├── documents.service.ts
│   │   │   │   ├── documents.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── document.entity.ts
│   │   │   │   ├── generation/
│   │   │   │   │   ├── report-generator.service.ts
│   │   │   │   │   ├── certificate-generator.service.ts
│   │   │   │   │   └── pdf-builder.service.ts
│   │   │   │   └── storage/
│   │   │   │       └── document-storage.service.ts
│   │   │   │
│   │   │   ├── receipts/
│   │   │   │   ├── receipts.controller.ts
│   │   │   │   ├── receipts.service.ts
│   │   │   │   ├── receipts.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── receipt.entity.ts
│   │   │   │   ├── generation/
│   │   │   │   │   ├── receipt-pdf.service.ts
│   │   │   │   │   └── numbering.service.ts (séquentiel)
│   │   │   │   └── payment-tracking/
│   │   │   │       └── payment-status.service.ts
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   ├── ai.module.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── openai-integration.ts
│   │   │   │   │   ├── specialty-model.ts
│   │   │   │   │   └── local-model.ts (optionnel)
│   │   │   │   ├── assistants/
│   │   │   │   │   ├── clinical-summary.assistant.ts
│   │   │   │   │   ├── diagnostic-suggestions.assistant.ts
│   │   │   │   │   ├── exam-explanation.assistant.ts
│   │   │   │   │   ├── learning-content.assistant.ts
│   │   │   │   │   └── chatbot.assistant.ts
│   │   │   │   ├── alerts/
│   │   │   │   │   ├── anomaly-detection.service.ts
│   │   │   │   │   ├── trend-analysis.service.ts
│   │   │   │   │   └── alert-generation.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── ai-request.dto.ts
│   │   │   │
│   │   │   ├── telemedicine/
│   │   │   │   ├── telemedicine.controller.ts
│   │   │   │   ├── telemedicine.service.ts
│   │   │   │   ├── telemedicine.module.ts
│   │   │   │   ├── video/
│   │   │   │   │   ├── video-provider.service.ts (Daily.co / Jitsi)
│   │   │   │   │   ├── video-room.service.ts
│   │   │   │   │   └── video-token.service.ts
│   │   │   │   ├── recording/
│   │   │   │   │   └── recording.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── video-consultation.dto.ts
│   │   │   │
│   │   │   ├── reviews/
│   │   │   │   ├── reviews.controller.ts
│   │   │   │   ├── reviews.service.ts
│   │   │   │   ├── reviews.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── review.entity.ts
│   │   │   │   ├── moderation/
│   │   │   │   │   └── review-moderation.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── create-review.dto.ts
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── analytics.module.ts
│   │   │   │   ├── metrics/
│   │   │   │   │   ├── appointment-metrics.service.ts
│   │   │   │   │   ├── patient-metrics.service.ts
│   │   │   │   │   ├── financial-metrics.service.ts
│   │   │   │   │   └── platform-metrics.service.ts
│   │   │   │   └── reports/
│   │   │   │       ├── report-generator.service.ts
│   │   │   │       └── export-service.ts
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.controller.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── channels/
│   │   │   │   │   ├── email.channel.ts (SMTP)
│   │   │   │   │   ├── sms.channel.ts (Twilio / OVH)
│   │   │   │   │   ├── push.channel.ts (FCM)
│   │   │   │   │   └── in-app.channel.ts
│   │   │   │   ├── templates/
│   │   │   │   │   ├── appointment-reminder.template.ts
│   │   │   │   │   ├── prescription-ready.template.ts
│   │   │   │   │   └── ...
│   │   │   │   └── queue/
│   │   │   │       └── notification-queue.service.ts (Bull Queue)
│   │   │   │
│   │   │   ├── specialty/
│   │   │   │   ├── specialty.controller.ts
│   │   │   │   ├── specialty.service.ts
│   │   │   │   ├── specialty.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── specialty.entity.ts
│   │   │   │   ├── config/
│   │   │   │   │   ├── ophthalmology.config.ts
│   │   │   │   │   ├── cardiology.config.ts
│   │   │   │   │   ├── dermatology.config.ts
│   │   │   │   │   └── ... (18+ spécialités)
│   │   │   │   └── dto/
│   │   │   │       └── specialty-config.dto.ts
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   ├── admin.module.ts
│   │   │   │   ├── audit/
│   │   │   │   │   ├── audit.service.ts
│   │   │   │   │   └── audit.entity.ts
│   │   │   │   ├── billing/
│   │   │   │   │   └── platform-billing.service.ts
│   │   │   │   └── security/
│   │   │   │       ├── security-logs.service.ts
│   │   │   │       └── encryption.service.ts
│   │   │   │
│   │   │   ├── messaging/
│   │   │   │   ├── messaging.controller.ts
│   │   │   │   ├── messaging.service.ts
│   │   │   │   ├── messaging.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── message.entity.ts
│   │   │   │   └── websocket/
│   │   │   │       ├── messaging.gateway.ts
│   │   │   │       └── messaging.adapter.ts
│   │   │   │
│   │   │   └── search/
│   │   │       ├── search.module.ts
│   │   │       ├── elasticsearch.service.ts
│   │   │       └── search-indexer.service.ts
│   │   │
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── is-user.decorator.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── filters/
│   │   │   │   ├── http-exception.filter.ts
│   │   │   │   └── validation.filter.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   └── transform.interceptor.ts
│   │   │   ├── middleware/
│   │   │   │   ├── cors.middleware.ts
│   │   │   │   └── rate-limit.middleware.ts
│   │   │   ├── pipes/
│   │   │   │   └── validation.pipe.ts
│   │   │   └── exceptions/
│   │   │       ├── custom-exception.ts
│   │   │       └── business-exception.ts
│   │   │
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   ├── ai.config.ts
│   │   │   ├── mail.config.ts
│   │   │   ├── s3.config.ts
│   │   │   └── app.config.ts
│   │   │
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   ├── 001-initial-schema.migration.ts
│   │   │   │   ├── 002-add-ai-tables.migration.ts
│   │   │   │   └── ...
│   │   │   ├── seeds/
│   │   │   │   ├── specialties.seed.ts
│   │   │   │   ├── medicines.seed.ts
│   │   │   │   └── demo.seed.ts
│   │   │   └── orm-config.ts (TypeORM / Prisma)
│   │   │
│   │   └── app.module.ts
│   │
│   ├── test/
│   │   ├── auth.spec.ts
│   │   ├── doctors.spec.ts
│   │   ├── appointments.spec.ts
│   │   └── ... (par module)
│   │
│   ├── .env.example
│   ├── .env.production
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json (si NestJS)
│   ├── docker-compose.yml
│   └── README.md
│
├── 📱 mobile/                          # React Native / Flutter (futur)
│   ├── lib/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   ├── pubspec.yaml (si Flutter)
│   └── README.md
│
├── 🗄️ Database Schema/
│   ├── schema.sql
│   ├── ERD.md
│   └── migrations/
│
├── 📚 Documentation/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API_SPEC.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── CONTRIBUTING.md
│
├── 🔧 Infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.nginx
│   │   └── docker-compose.yml
│   ├── k8s/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── nginx/
│   │   └── nginx.conf
│   └── env/
│       ├── .env.dev
│       ├── .env.staging
│       └── .env.prod
│
├── 📋 Project Management/
│   ├── PHASES.md
│   ├── ROADMAP.md
│   ├── SPRINTS/
│   │   ├── SPRINT_1.md
│   │   ├── SPRINT_2.md
│   │   └── ...
│   └── ISSUES.md
│
├── 🧪 Tests/
│   ├── e2e/
│   ├── integration/
│   ├── unit/
│   └── cypress.config.ts (si E2E)
│
└── 📖 ROOT FILES
    ├── README.md                       # Vue d'ensemble projet
    ├── CAHIER_DES_CHARGES.md           # CDC complet
    ├── PROJECT_STRUCTURE.md            # Ce fichier
    ├── PHASES.md                       # Plan des phases
    ├── .gitignore
    ├── docker-compose.yml
    └── Makefile (optionnel)
```

---

## 📊 Tableau des Dépendances Entre Modules

```
Authentification (Auth)
    ↓
Utilisateurs (Users)
    ↓
┌─────────────────────────────────────────┐
│                                         │
Médecins    Patients    Secrétaires    Admin
   ├──────────┴──────────┴──────────┐
   ↓
Rendez-vous (Appointments)
   ├─ Calendrier sync
   ├─ Notifications
   └─ Téléconsultation
   ↓
Consultations
   ├─ Templates spécialités
   ├─ Examens/DICOM
   ├─ Comparaisons
   └─ IA Assistant
   ↓
Documents (Prescriptions, Reports, Receipts)
   └─ PDF Generation, Signatures, QR codes
   ↓
Analytiques & Statistiques
   ├─ Métriques patients
   ├─ Métriques financières
   └─ Rapports export
```

---

## 🎯 Points d'Intégration Critiques

1. **Frontend ↔ Backend**: API REST avec headers d'authentification
2. **Notifications**: Queue (Bull) → Multi-channel (Email, SMS, Push)
3. **Examens**: Upload S3 → DICOM processing (Orthanc)
4. **IA**: Consultation data → OpenAI/Model → Suggestions
5. **Calendrier**: Google/Outlook API bidirectionnelle
6. **Vidéo**: WebRTC intégré ou Daily.co/Jitsi
7. **Recherche**: Elasticsearch pour annuaire & patients
8. **Auth**: JWT + 2FA + encryption

