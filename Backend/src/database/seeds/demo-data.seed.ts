import {
  AppointmentStatus,
  AppointmentType,
  AppointmentVisitKind,
  ConsultationStatus,
  PatientInAppNotificationKind,
  PaymentReceiptMethod,
  PaymentReceiptStatus,
  PdfGenerationStatus,
  PlatformAuditAction,
  Prisma,
  PrismaClient,
  ScheduleBlockKind,
  TraineeSessionStatus,
  TraineeSessionType,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { bootstrapDoctorSpace } from '../../modules/doctors/doctors-space.bootstrap';
import { buildConversationId } from '../../modules/messaging/messaging.util';
import { OPHTHALMOLOGY_FIELD_TEMPLATE } from '../../modules/medical-records/ophthalmology-template';
import type { DemoPatientRef, DemoSeedCore } from './demo-seed.types';

const OPHTHALMO_EXAMPLE = OPHTHALMOLOGY_FIELD_TEMPLATE.exampleStructuredData;

/** Sérialise pour champs Prisma `Json` (évite Record<string, unknown> non assignable). */
function asPrismaJson(value: object): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function daysFromNow(days: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

/** Délégation si client Prisma pas régénéré. */
function preConsultationFormCreate(
  prisma: PrismaClient,
  data: {
    patientId: string;
    doctorSpaceId: string;
    specialtyCode?: string | null;
    responses: object;
    originalSnapshot: object;
    publicToken?: string | null;
  },
): Promise<{ id: string }> {
  const delegate = (
    prisma as unknown as {
      preConsultationForm?: { create: (args: { data: object }) => Promise<{ id: string }> };
    }
  ).preConsultationForm;
  if (!delegate?.create) {
    throw new Error('PreConsultationForm: exécutez npx prisma generate');
  }
  return delegate.create({ data });
}

async function upsertPatientAccess(
  prisma: PrismaClient,
  patientId: string,
  doctorSpaceId: string,
  lastVisit: Date,
  firstVisit?: Date,
) {
  await prisma.patientDoctorAccess.upsert({
    where: { patientId_doctorSpaceId: { patientId, doctorSpaceId } },
    create: {
      patientId,
      doctorSpaceId,
      firstVisit: firstVisit ?? lastVisit,
      lastVisit,
    },
    update: { lastVisit },
  });
}

async function seedExtraPatients(core: DemoSeedCore): Promise<DemoPatientRef[]> {
  const { prisma, passwordHash, doctorSpaceId } = core;
  const specs = [
    {
      email: 'fatima.demo@ophthocare.local',
      firstName: 'Fatima',
      lastName: 'Zahra',
      phone: '+212600000101',
      dateOfBirth: new Date('1988-03-12'),
      gender: 'F',
      diagnoses: [{ code: 'H52.1', label: 'Myopie modérée', recordedAt: new Date().toISOString() }],
      allergies: ['Pénicilline'],
      address: 'Quartier Maârif, Casablanca',
    },
    {
      email: 'karim.demo@ophthocare.local',
      firstName: 'Karim',
      lastName: 'Idrissi',
      phone: '+212600000102',
      dateOfBirth: new Date('1975-11-02'),
      gender: 'M',
      diagnoses: [{ code: 'H40.1', label: 'Glaucome primitif à angle ouvert', recordedAt: new Date().toISOString() }],
      allergies: [] as string[],
      address: 'Ain Diab, Casablanca',
    },
    {
      email: 'nadia.demo@ophthocare.local',
      firstName: 'Nadia',
      lastName: 'Berrada',
      phone: '+212600000103',
      dateOfBirth: new Date('1992-07-20'),
      gender: 'F',
      diagnoses: [{ code: 'H35.3', label: 'Dégénérescence maculaire liée à l’âge — suspicion', recordedAt: new Date().toISOString() }],
      allergies: ['Latex'],
      address: 'Gauthier, Casablanca',
    },
    {
      email: 'hassan.demo@ophthocare.local',
      firstName: 'Hassan',
      lastName: 'Tazi',
      phone: '+212600000104',
      dateOfBirth: new Date('1960-01-08'),
      gender: 'M',
      diagnoses: [
        { code: 'E11', label: 'Diabète type 2', recordedAt: new Date().toISOString() },
        { code: 'H36.0', label: 'Rétinopathie diabétique — suivi', recordedAt: new Date().toISOString() },
      ],
      allergies: [] as string[],
      address: 'Hay Hassani, Casablanca',
    },
  ] as const;

  const refs: DemoPatientRef[] = [
    {
      id: core.mainPatient.id,
      userId: core.mainPatient.userId,
      email: 'patient.demo@ophthocare.local',
      label: 'Ahmed Benali',
    },
  ];

  for (const s of specs) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        password: passwordHash,
        firstName: s.firstName,
        lastName: s.lastName,
        role: UserRole.patient,
        phoneNumber: s.phone,
      },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        phoneNumber: s.phone,
      },
    });
    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        diagnoses: s.diagnoses,
        allergies: [...s.allergies],
        address: s.address,
        bloodType: s.gender === 'M' ? 'A+' : 'O+',
        insuranceProvider: 'CNSS',
        cnssAffiliation: 'Actif',
      },
      update: {
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        diagnoses: s.diagnoses,
        allergies: [...s.allergies],
        address: s.address,
      },
    });
    await upsertPatientAccess(prisma, patient.id, doctorSpaceId, daysFromNow(-14), daysFromNow(-90));
    refs.push({
      id: patient.id,
      userId: user.id,
      email: s.email,
      label: `${s.firstName} ${s.lastName}`,
    });
  }

  return refs;
}

async function seedAgenda(core: DemoSeedCore, patients: DemoPatientRef[]) {
  const { prisma, doctor, doctorSpaceId, doctorSiteId } = core;
  const base = { doctorId: doctor.id, doctorSpaceId, doctorSiteId: doctorSiteId ?? undefined };

  const slots: Array<{
    key: string;
    patientIndex: number;
    start: Date;
    durationMin: number;
    status: AppointmentStatus;
    type: AppointmentType;
    visitKind: AppointmentVisitKind;
    reason: string;
  }> = [
    {
      key: 'past-completed-ahmed',
      patientIndex: 0,
      start: daysFromNow(-21, 9, 0),
      durationMin: 30,
      status: AppointmentStatus.completed,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.followup,
      reason: 'Contrôle post-traitement',
    },
    {
      key: 'past-completed-karim',
      patientIndex: 2,
      start: daysFromNow(-10, 11, 0),
      durationMin: 45,
      status: AppointmentStatus.completed,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.followup,
      reason: 'Suivi glaucome — PIO + champ visuel',
    },
    {
      key: 'today-in-progress-hassan',
      patientIndex: 4,
      start: daysFromNow(0, 9, 30),
      durationMin: 30,
      status: AppointmentStatus.in_progress,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.followup,
      reason: 'Rétinopathie diabétique — OCT',
    },
    {
      key: 'today-confirmed-fatima',
      patientIndex: 1,
      start: daysFromNow(0, 14, 0),
      durationMin: 30,
      status: AppointmentStatus.confirmed,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.new_visit,
      reason: 'Première consultation — gêne visuelle',
    },
    {
      key: 'future-confirmed-nadia',
      patientIndex: 3,
      start: daysFromNow(7, 10, 0),
      durationMin: 30,
      status: AppointmentStatus.confirmed,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.new_visit,
      reason: 'Bilan maculaire',
    },
    {
      key: 'future-confirmed-ahmed-annual',
      patientIndex: 0,
      start: daysFromNow(7, 10, 0),
      durationMin: 30,
      status: AppointmentStatus.confirmed,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.followup,
      reason: 'Contrôle annuel',
    },
    {
      key: 'future-pending-fatima',
      patientIndex: 1,
      start: daysFromNow(14, 11, 0),
      durationMin: 30,
      status: AppointmentStatus.pending,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.new_visit,
      reason: 'Demande en attente de validation',
    },
    {
      key: 'future-video-ahmed',
      patientIndex: 0,
      start: daysFromNow(3, 15, 0),
      durationMin: 30,
      status: AppointmentStatus.confirmed,
      type: AppointmentType.video,
      visitKind: AppointmentVisitKind.teleconsult,
      reason: 'Téléconsultation — résultats examens',
    },
    {
      key: 'cancelled-fatima',
      patientIndex: 1,
      start: daysFromNow(-3, 16, 0),
      durationMin: 30,
      status: AppointmentStatus.cancelled,
      type: AppointmentType.in_person,
      visitKind: AppointmentVisitKind.new_visit,
      reason: 'Annulé par patient',
    },
  ];

  const created: Record<string, { id: string; patientId: string }> = {};

  for (const slot of slots) {
    const patient = patients[slot.patientIndex];
    if (!patient) continue;
    const end = addMinutes(slot.start, slot.durationMin);
    let apt = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: patient.id,
        reason: slot.reason,
        deletedAt: null,
      },
    });
    if (!apt) {
      apt = await prisma.appointment.create({
        data: {
          ...base,
          patientId: patient.id,
          startTime: slot.start,
          endTime: end,
          status: slot.status,
          type: slot.type,
          visitKind: slot.visitKind,
          reason: slot.reason,
          cancelReason: slot.status === AppointmentStatus.cancelled ? 'Indisponibilité patient' : undefined,
        },
      });
    } else {
      apt = await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          startTime: slot.start,
          endTime: end,
          status: slot.status,
          doctorSpaceId,
          doctorSiteId: doctorSiteId ?? undefined,
        },
      });
    }
    created[slot.key] = { id: apt.id, patientId: patient.id };
    if (slot.status === AppointmentStatus.confirmed || slot.status === AppointmentStatus.completed) {
      await upsertPatientAccess(prisma, patient.id, doctorSpaceId, slot.start);
    }
  }

  const preConsultLinks: Array<{ aptKey: string; patientIndex: number; snap: object; token?: string }> = [
    {
      aptKey: 'future-confirmed-nadia',
      patientIndex: 3,
      snap: { motif: 'Vision floue centrale', dureeMois: 3, oeilDominant: 'OD' },
      token: `demo-pre-nadia`,
    },
    {
      aptKey: 'future-confirmed-ahmed-annual',
      patientIndex: 0,
      snap: { acuiteOD: 8, acuiteOG: 10, pio: 14, refraction: '-1.00 / -0.25 180' },
      token: `demo-pre-ahmed`,
    },
  ];

  for (const link of preConsultLinks) {
    const patient = patients[link.patientIndex];
    const aptId = created[link.aptKey]?.id;
    if (!patient || !aptId) continue;
    const apt = await prisma.appointment.findUnique({
      where: { id: aptId },
      select: { preConsultationFormId: true },
    });
    if (apt?.preConsultationFormId) continue;
    const pre = await preConsultationFormCreate(prisma, {
      patientId: patient.id,
      doctorSpaceId,
      specialtyCode: 'ophthalmology',
      responses: link.snap,
      originalSnapshot: link.snap,
      publicToken: link.token ?? null,
    });
    await prisma.appointment.update({
      where: { id: aptId },
      data: { preConsultationFormId: pre.id },
    });
  }

  const blockStart = daysFromNow(21, 0, 0);
  const blockEnd = daysFromNow(23, 23, 59);
  const block = await prisma.scheduleBlock.findFirst({
    where: { doctorId: doctor.id, note: { contains: 'Congrès' } },
  });
  if (!block) {
    await prisma.scheduleBlock.create({
      data: {
        doctorId: doctor.id,
        doctorSpaceId,
        doctorSiteId: doctorSiteId ?? undefined,
        kind: ScheduleBlockKind.vacation,
        note: 'Congrès — indisponible (démo)',
        startTime: blockStart,
        endTime: blockEnd,
      },
    });
  }

  return created;
}

async function seedClinical(core: DemoSeedCore, patients: DemoPatientRef[], agenda: Record<string, { id: string }>) {
  const { prisma, doctor, doctorUser, doctorSpaceId } = core;
  const structuredCompleted = asPrismaJson({
    ...OPHTHALMO_EXAMPLE,
    visualAcuity: { od: '9/10 P2', og: '10/10', method: 'Snellen' },
    intraocularPressure: { od: 16, og: 15, time: '10h30' },
    refraction: { od: '-1.25 (-0.50) 180°', og: '-0.75' },
    anteriorSegment: { notes: 'Cornée claire, cristallin transparent' },
    fundus: { notes: 'Papille rose, cup/disc 0.3, macula normale' },
  });

  const ahmed = patients[0];
  const karim = patients[2];
  if (!ahmed || !karim) return;

  let completedConsult = await prisma.consultation.findFirst({
    where: {
      patientId: ahmed.id,
      doctorId: doctor.id,
      status: ConsultationStatus.completed,
      diagnosis: { contains: 'démo seed' },
    },
  });
  if (!completedConsult) {
    const closedAt = daysFromNow(-21, 9, 45);
    const startAt = daysFromNow(-21, 9, 5);
    completedConsult = await prisma.consultation.create({
      data: {
        patientId: ahmed.id,
        doctorId: doctor.id,
        doctorSpaceId,
        specialtyCode: 'ophthalmology',
        appointmentId: agenda['past-completed-ahmed']?.id,
        status: ConsultationStatus.completed,
        startAt,
        closedAt,
        durationSeconds: 40 * 60,
        structuredData: structuredCompleted,
        observations: 'Examen complet sans anomalie significative.',
        diagnosis: 'Myopie légère stable — démo seed',
        plan: 'Contrôle annuel, lunettes à jour si gêne.',
      },
    });
    await prisma.consultationReceipt.create({
      data: {
        consultationId: completedConsult.id,
        amount: 350,
        currency: 'MAD',
        payload: { actLabel: 'Consultation', method: 'CASH' },
      },
    });
  }

  let glaucomaConsult = await prisma.consultation.findFirst({
    where: { patientId: karim.id, doctorId: doctor.id, diagnosis: { contains: 'Glaucome' } },
  });
  if (!glaucomaConsult) {
    glaucomaConsult = await prisma.consultation.create({
      data: {
        patientId: karim.id,
        doctorId: doctor.id,
        doctorSpaceId,
        specialtyCode: 'ophthalmology',
        appointmentId: agenda['past-completed-karim']?.id,
        status: ConsultationStatus.completed,
        startAt: daysFromNow(-10, 11, 0),
        closedAt: daysFromNow(-10, 11, 40),
        durationSeconds: 40 * 60,
        structuredData: asPrismaJson({
          ...OPHTHALMO_EXAMPLE,
          intraocularPressure: { od: 22, og: 21, time: '11h15' },
          fundus: { notes: 'Excavation papillaire 0.5 OD, 0.4 OG' },
        }),
        observations: 'PIO limite haute, champ visuel à programmer.',
        diagnosis: 'H40.1 Glaucome primitif à angle ouvert — suivi',
        plan: 'Latanoprost le soir, contrôle à 3 mois.',
      },
    });
  }

  const draftExists = await prisma.consultation.findFirst({
    where: { patientId: ahmed.id, status: ConsultationStatus.draft },
  });
  if (!draftExists) {
    await prisma.consultation.create({
      data: {
        patientId: ahmed.id,
        doctorId: doctor.id,
        doctorSpaceId,
        specialtyCode: 'ophthalmology',
        status: ConsultationStatus.draft,
        structuredData: asPrismaJson(OPHTHALMO_EXAMPLE),
        observations: 'Brouillon — consultation du jour (démo)',
      },
    });
  }

  const inProgressExists = await prisma.consultation.findFirst({
    where: { patientId: patients[4]?.id, status: ConsultationStatus.in_progress },
  });
  if (!inProgressExists && patients[4]) {
    await prisma.consultation.create({
      data: {
        patientId: patients[4].id,
        doctorId: doctor.id,
        doctorSpaceId,
        specialtyCode: 'ophthalmology',
        appointmentId: agenda['today-in-progress-hassan']?.id,
        status: ConsultationStatus.in_progress,
        startAt: daysFromNow(0, 9, 30),
        structuredData: asPrismaJson({
          ...OPHTHALMO_EXAMPLE,
          fundus: { notes: 'Microanévrismes, quelques hémorragies punctiformes' },
        }),
        observations: 'Examen en cours — OCT réalisé.',
      },
    });
  }

  const recordExists = await prisma.medicalRecord.findFirst({
    where: { patientId: ahmed.id, doctorSpaceId, title: 'Bilan ophtalmologique initial (démo)' },
  });
  if (!recordExists) {
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: ahmed.id,
        authorUserId: doctorUser.id,
        doctorSpaceId,
        specialtyCode: 'ophthalmology',
        appointmentId: agenda['past-completed-ahmed']?.id,
        title: 'Bilan ophtalmologique initial (démo)',
        narrative: 'Première visite dans le cabinet — acuité et fond d’œil normaux.',
        structuredData: structuredCompleted,
      },
    });
    await prisma.medicalRecordVersion.create({
      data: {
        medicalRecordId: record.id,
        editedByUserId: doctorUser.id,
        snapshot: structuredCompleted,
        changeSummary: 'Création dossier démo',
      },
    });
  }

  await prisma.patientConsent.upsert({
    where: { patientId_type: { patientId: ahmed.id, type: 'data_processing' } },
    create: { patientId: ahmed.id, type: 'data_processing', signedAt: daysFromNow(-120) },
    update: {},
  });
}

async function seedDocuments(core: DemoSeedCore, patients: DemoPatientRef[], consultations: { completedId?: string; glaucomaId?: string }) {
  const { prisma, doctor, doctorSpaceId } = core;
  const ahmed = patients[0];
  const karim = patients[2];
  if (!ahmed) return;

  const year = new Date().getFullYear();
  await prisma.doctorSpaceReceiptCounter.upsert({
    where: { doctorSpaceId_year: { doctorSpaceId, year } },
    create: { doctorSpaceId, year, lastNumber: 3 },
    update: { lastNumber: 3 },
  });

  const receiptNums = [`${year}-00001`, `${year}-00002`, `${year}-00003`];
  const receiptSpecs = [
    { patient: ahmed, num: receiptNums[0], amount: 350, label: 'Consultation', status: PaymentReceiptStatus.PAID },
    { patient: karim, num: receiptNums[1], amount: 450, label: 'Consultation + OCT', status: PaymentReceiptStatus.PAID },
    { patient: ahmed, num: receiptNums[2], amount: 120, label: 'Acte complémentaire', status: PaymentReceiptStatus.PENDING },
  ];

  for (const r of receiptSpecs) {
    if (!r.patient) continue;
    await prisma.paymentReceipt.upsert({
      where: {
        doctorSpaceId_sequentialNumber: { doctorSpaceId, sequentialNumber: r.num },
      },
      create: {
        patientId: r.patient.id,
        doctorId: doctor.id,
        doctorSpaceId,
        sequentialNumber: r.num,
        actType: 'consultation',
        actLabel: r.label,
        amount: r.amount,
        currency: 'MAD',
        status: r.status,
        paidAt: r.status === PaymentReceiptStatus.PAID ? daysFromNow(-5) : null,
        paymentMethod: r.status === PaymentReceiptStatus.PAID ? PaymentReceiptMethod.CASH : null,
        pdfStatus: PdfGenerationStatus.ready,
        pdfUrl: `/uploads/demo/receipt-${r.num}.pdf`,
      },
      update: {
        status: r.status,
        pdfStatus: PdfGenerationStatus.ready,
      },
    });
  }

  const rxExists = await prisma.prescription.findFirst({
    where: { patientId: karim?.id, doctorSpaceId },
  });
  if (!rxExists && karim) {
    await prisma.prescription.create({
      data: {
        patientId: karim.id,
        doctorId: doctor.id,
        doctorSpaceId,
        consultationId: consultations.glaucomaId,
        type: 'STANDARD',
        medications: [
          { name: 'Latanoprost', dosage: '0,005 %', posology: '1 goutte le soir OG et OD', duration: '3 mois' },
          { name: 'Timolol collyre', dosage: '0,5 %', posology: '1 goutte matin', duration: '3 mois' },
        ],
        pdfStatus: PdfGenerationStatus.ready,
        pdfUrl: '/uploads/demo/prescription-glaucoma.pdf',
        documentFooterNumber: 'ORD-2026-001',
      },
    });
  }

  const reportExists = await prisma.medicalReport.findFirst({
    where: { patientId: ahmed.id, title: 'Compte rendu de consultation (démo)' },
  });
  if (!reportExists) {
    await prisma.medicalReport.create({
      data: {
        patientId: ahmed.id,
        doctorId: doctor.id,
        doctorSpaceId,
        consultationId: consultations.completedId,
        title: 'Compte rendu de consultation (démo)',
        content:
          'Résumé : examen ophtalmologique sans signe de pathologie aiguë. Recommandation de contrôle annuel et correction optique si besoin.',
        specialtyCode: 'ophthalmology',
        reportType: 'CONSULTATION',
        pdfStatus: PdfGenerationStatus.ready,
        pdfUrl: '/uploads/demo/report-ahmed.pdf',
        sentToPatientAt: daysFromNow(-20),
        shareToken: `share-demo-${ahmed.id.slice(0, 8)}`,
      },
    });
  }

  const letterExists = await prisma.referralLetter.findFirst({
    where: { patientId: karim?.id, recipientName: 'Dr. Salmi — Neuro-ophtalmologie' },
  });
  if (!letterExists && karim) {
    await prisma.referralLetter.create({
      data: {
        patientId: karim.id,
        doctorId: doctor.id,
        doctorSpaceId,
        consultationId: consultations.glaucomaId,
        recipientName: 'Dr. Salmi — Neuro-ophtalmologie',
        recipientSpecialty: 'Neuro-ophtalmologie',
        recipientAddress: 'CHU Ibn Rochd, Casablanca',
        body: 'Cher confrère,\n\nJe vous adresse M. Idrissi pour avis sur progression du glaucome et adaptation thérapeutique.\n\nCordialement,\nDr. Dupont',
        status: 'sent',
      },
    });
  }
}

async function seedMessaging(core: DemoSeedCore, patients: DemoPatientRef[]) {
  const { prisma, doctor, doctorUser, doctorSpaceId, secretaryUserId } = core;
  const ahmed = patients[0];
  if (!ahmed) return;

  const convId = buildConversationId(ahmed.userId, doctorSpaceId);
  await prisma.conversation.upsert({
    where: { id: convId },
    create: {
      id: convId,
      patientId: ahmed.id,
      doctorSpaceId,
      lastMessageAt: daysFromNow(-1, 16, 0),
      unreadCountDoctor: 0,
      unreadCountPatient: 1,
    },
    update: { lastMessageAt: daysFromNow(-1, 16, 0) },
  });

  const msgCount = await prisma.message.count({ where: { conversationId: convId } });
  if (msgCount === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: convId,
          senderId: ahmed.userId,
          senderRole: UserRole.patient,
          content: 'Bonjour, puis-je avoir une copie de mon dernier compte rendu ?',
          createdAt: daysFromNow(-2, 10, 0),
        },
        {
          conversationId: convId,
          senderId: secretaryUserId,
          senderRole: UserRole.secretary,
          content: 'Bonjour M. Benali, le document est disponible dans votre espace Documents.',
          createdAt: daysFromNow(-2, 10, 15),
          readAt: daysFromNow(-2, 10, 20),
        },
        {
          conversationId: convId,
          senderId: ahmed.userId,
          senderRole: UserRole.patient,
          content: 'Merci beaucoup !',
          createdAt: daysFromNow(-1, 16, 0),
        },
      ],
    });
  }

  const cabMsg = await prisma.doctorPatientMessage.findFirst({
    where: { patientId: ahmed.id, subject: 'Rappel bilan annuel (démo)' },
  });
  if (!cabMsg) {
    await prisma.doctorPatientMessage.create({
      data: {
        doctorSpaceId,
        doctorId: doctor.id,
        patientId: ahmed.id,
        subject: 'Rappel bilan annuel (démo)',
        body: 'Pensez à prendre rendez-vous pour votre contrôle annuel. L’équipe du cabinet reste à votre disposition.',
      },
    });
  }

  const notifCount = await prisma.patientInAppNotification.count({ where: { patientId: ahmed.id } });
  if (notifCount < 3) {
    await prisma.patientInAppNotification.createMany({
      data: [
        {
          patientId: ahmed.id,
          kind: PatientInAppNotificationKind.appointment,
          title: 'Rendez-vous confirmé',
          body: 'Votre téléconsultation est prévue dans 3 jours à 15h00.',
          linkPath: '/dashboard/patient/bookings',
        },
        {
          patientId: ahmed.id,
          kind: PatientInAppNotificationKind.document,
          title: 'Nouveau compte rendu',
          body: 'Un compte rendu est disponible dans vos documents.',
          linkPath: '/dashboard/patient/documents',
        },
        {
          patientId: ahmed.id,
          kind: PatientInAppNotificationKind.receipt,
          title: 'Reçu de paiement',
          body: 'Reçu n° 2026-00001 disponible au téléchargement.',
          linkPath: '/dashboard/patient/receipts',
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.broadcastLog.deleteMany({
    where: { doctorSpaceId, subject: 'Newsletter — Journée mondiale de la vision (démo)' },
  });
  await prisma.broadcastLog.create({
    data: {
      doctorSpaceId,
      doctorId: doctor.id,
      subject: 'Newsletter — Journée mondiale de la vision (démo)',
      content: 'Rappel : dépistage gratuit la semaine prochaine pour les patients suivis.',
      recipientFilter: 'ACTIVE_LAST_30D',
      recipientCount: patients.length,
    },
  });
}

async function seedTraineeAndImaging(core: DemoSeedCore, patients: DemoPatientRef[]) {
  const { prisma, doctor, doctorSpaceId, traineeUserId } = core;
  const karim = patients[2];
  if (!karim) return;

  const imgExists = await prisma.patientMedicalImage.findFirst({
    where: { patientId: karim.id, title: 'OCT macula — démo' },
  });
  if (!imgExists) {
    await prisma.patientMedicalImage.create({
      data: {
        patientId: karim.id,
        doctorId: doctor.id,
        doctorSpaceId,
        examType: 'OCT',
        title: 'OCT macula — démo',
        fileUrl: '/uploads/demo/oct-macula-placeholder.png',
        mimeType: 'image/png',
        notes: 'Coupes maculaires haute résolution (données fictives).',
        aiAnalysis: {
          summary: 'Profil maculaire régulier, pas d’œdème cystoïde visible sur cette coupe.',
          pedagogicalHints: ['Comparer avec l’œil controlatéral', 'Vérifier l’épaisseur fovéolaire'],
        },
      },
    });
  }

  const sessionExists = await prisma.traineeLearningSession.findFirst({
    where: { userId: traineeUserId, title: 'Quiz — Glaucome (démo)' },
  });
  if (!sessionExists) {
    await prisma.traineeLearningSession.createMany({
      data: [
        {
          userId: traineeUserId,
          doctorSpaceId,
          type: TraineeSessionType.quiz,
          status: TraineeSessionStatus.completed,
          title: 'Quiz — Glaucome (démo)',
          topic: 'Glaucome',
          scorePercent: 80,
          completedAt: daysFromNow(-2),
          quizData: {
            questions: [
              { id: 'q1', prompt: 'PIO normale approximative ?', options: ['5-10', '10-21', '25-30'] },
            ],
          },
          userAnswers: { q1: 1 },
        },
        {
          userId: traineeUserId,
          doctorSpaceId,
          type: TraineeSessionType.chat,
          status: TraineeSessionStatus.completed,
          title: 'Tuteur IA — Fond d’œil (démo)',
          topic: 'Fond d’œil',
          completedAt: daysFromNow(-1),
          messages: [
            { role: 'user', content: 'Signes d’alarme au fond d’œil ?' },
            { role: 'assistant', content: 'Papille œdémateuse, hémorragies nombreuses, décollement de rétine…' },
          ],
        },
        {
          userId: traineeUserId,
          doctorSpaceId,
          patientId: karim.id,
          type: TraineeSessionType.exam_explanation,
          status: TraineeSessionStatus.in_progress,
          title: 'Explication OCT — en cours',
        },
      ],
    });
  }
}

async function seedAdminPlatform(core: DemoSeedCore, passwordHash: string) {
  const { prisma, doctor, doctorUser, doctorSpaceId } = core;

  await prisma.doctorReview.deleteMany({ where: { doctorId: doctor.id, status: 'pending' } });
  await prisma.doctorReview.createMany({
    data: [
      {
        doctorId: doctor.id,
        rating: 5,
        comment: 'Très professionnel, explications claires.',
        status: 'pending',
      },
      {
        doctorId: doctor.id,
        rating: 4,
        comment: 'Bon suivi, attente un peu longue en salle.',
        status: 'pending',
      },
      {
        doctorId: doctor.id,
        rating: 5,
        comment: 'Excellent praticien, je recommande.',
        status: 'approved',
        moderatedAt: daysFromNow(-30),
      },
    ],
  });

  const auditCount = await prisma.platformAuditLog.count({
    where: { userId: doctorUser.id, action: PlatformAuditAction.LOGIN_SUCCESS },
  });
  if (auditCount < 2) {
    await prisma.platformAuditLog.createMany({
      data: [
        {
          userId: doctorUser.id,
          doctorSpaceId,
          action: PlatformAuditAction.LOGIN_SUCCESS,
          ip: '127.0.0.1',
          userAgent: 'Seed/demo',
        },
        {
          userId: doctorUser.id,
          doctorSpaceId,
          action: PlatformAuditAction.CREATE_CONSULTATION,
          entityIdHash: randomUUID().replace(/-/g, ''),
          ip: '127.0.0.1',
        },
        {
          userId: doctorUser.id,
          doctorSpaceId,
          action: PlatformAuditAction.GENERATE_PRESCRIPTION,
          entityIdHash: randomUUID().replace(/-/g, ''),
          ip: '127.0.0.1',
        },
      ],
    });
  }

  await prisma.failedLoginAttempt.deleteMany({ where: { email: 'intrus@example.com' } });
  await prisma.failedLoginAttempt.createMany({
    data: [
      { email: 'intrus@example.com', ip: '203.0.113.10' },
      { email: 'admin@ophthocare.local', ip: '203.0.113.11' },
      { email: 'dr.demo@ophthocare.local', ip: '203.0.113.12' },
    ],
  });

  const cardioUser = await prisma.user.upsert({
    where: { email: 'dr.cardio.demo@ophthocare.local' },
    create: {
      email: 'dr.cardio.demo@ophthocare.local',
      password: passwordHash,
      firstName: 'Karim',
      lastName: 'Bennani',
      role: UserRole.doctor,
      phoneNumber: '+212600000201',
    },
    update: { firstName: 'Karim', lastName: 'Bennani' },
  });

  const cardioDoctor = await prisma.doctor.upsert({
    where: { userId: cardioUser.id },
    create: {
      userId: cardioUser.id,
      specialtyCode: 'cardiology',
      city: 'Rabat',
      street: 'Avenue Mohammed V',
      postalCode: '10000',
      consultationPrice: 400,
      rating: 4.6,
      reviewCount: 18,
      bio: 'Cardiologue — annuaire public démo.',
      isVerified: true,
      isCertified: true,
      workingHours: { mon: ['08:00-12:00'], wed: ['14:00-18:00'] },
    },
    update: { isVerified: true, isCertified: true },
  });

  await bootstrapDoctorSpace(prisma, cardioDoctor.id);

  await prisma.doctorReview.create({
    data: {
      doctorId: cardioDoctor.id,
      rating: 5,
      comment: 'Écoute attentive, examen complet.',
      status: 'approved',
      moderatedAt: daysFromNow(-60),
    },
  });
}

/** Jeu de données riche pour tous les dashboards (idempotent). */
export async function seedDemoRichData(core: DemoSeedCore): Promise<void> {
  const patients = await seedExtraPatients(core);
  const agenda = await seedAgenda(core, patients);
  await seedClinical(core, patients, agenda);

  const completed = await core.prisma.consultation.findFirst({
    where: { patientId: core.mainPatient.id, status: ConsultationStatus.completed },
    select: { id: true },
  });
  const glaucoma = await core.prisma.consultation.findFirst({
    where: { patientId: patients[2]?.id, diagnosis: { contains: 'Glaucome' } },
    select: { id: true },
  });

  await seedDocuments(core, patients, {
    completedId: completed?.id,
    glaucomaId: glaucoma?.id,
  });
  await seedMessaging(core, patients);
  await seedTraineeAndImaging(core, patients);
  await seedAdminPlatform(core, core.passwordHash);
}
