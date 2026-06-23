import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SPECIALTIES_SEED, specialtyCreateInputFromSeed } from './specialties.seed';
import { bootstrapDoctorSpace } from '../../modules/doctors/doctors-space.bootstrap';
import { seedMedications } from './medications.seed';
import { seedDemoRichData } from './demo-data.seed';

/** Mot de passe unique pour tous les comptes de démonstration. */
export const DEMO_PASSWORD = 'OphthoDemo2024!';

/** Lien stagiaire ↔ espace (délégation si `prisma generate` n’a pas été relancé). */
function traineeDoctorSpaceUpsert(
  prisma: PrismaClient,
  args: {
    where: { userId: string };
    create: { userId: string; doctorSpaceId: string };
    update: { doctorSpaceId: string };
  },
): Promise<unknown> {
  const delegate = (
    prisma as unknown as {
      traineeDoctorSpace?: { upsert: (a: typeof args) => Promise<unknown> };
    }
  ).traineeDoctorSpace;
  if (!delegate?.upsert) {
    throw new Error(
      'Modèle TraineeDoctorSpace introuvable sur le client Prisma. Exécutez : cd Backend && npx prisma generate',
    );
  }
  return delegate.upsert(args);
}

async function runSeeds() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const specialtyData of SPECIALTIES_SEED) {
    const input = specialtyCreateInputFromSeed(specialtyData);
    await prisma.specialty.upsert({
      where: { code: specialtyData.code },
      create: input as never,
      update: {
        name: input.name,
        description: input.description,
        icon: input.icon,
        specificFields: specialtyData.specificFields as never,
        examTypes: specialtyData.examTypes as never,
      } as never,
    });
  }

  const doctorUser = await prisma.user.upsert({
    where: { email: 'dr.demo@ophthocare.local' },
    create: {
      email: 'dr.demo@ophthocare.local',
      password: passwordHash,
      firstName: 'Marie',
      lastName: 'Dupont',
      role: UserRole.doctor,
      phoneNumber: '+212600000001',
    },
    update: {
      firstName: 'Marie',
      lastName: 'Dupont',
      phoneNumber: '+212600000001',
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    create: {
      userId: doctorUser.id,
      specialtyCode: 'ophthalmology',
      city: 'Casablanca',
      street: 'Boulevard Zerktouni',
      postalCode: '20100',
      consultationPrice: 350,
      rating: 4.85,
      reviewCount: 42,
      bio: 'Ophtalmologiste — démonstration OphthoCare.',
      isVerified: true,
      isCertified: true,
      workingHours: { mon: ['09:00-12:00', '14:00-18:00'], tue: ['09:00-12:00'], wed: ['14:00-18:00'] },
    },
    update: {
      specialtyCode: 'ophthalmology',
      city: 'Casablanca',
      street: 'Boulevard Zerktouni',
      postalCode: '20100',
      consultationPrice: 350,
      isVerified: true,
      isCertified: true,
    },
  });

  await bootstrapDoctorSpace(prisma, doctor.id);

  const doctorSpace = await prisma.doctorSpace.findUnique({
    where: { doctorId: doctor.id },
    select: { id: true },
  });
  const primarySite = doctorSpace
    ? await prisma.doctorSite.findFirst({
        where: { doctorSpaceId: doctorSpace.id, isPrimary: true },
        select: { id: true },
      })
    : null;

  const secretaryUser = await prisma.user.upsert({
    where: { email: 'secretaire.demo@ophthocare.local' },
    create: {
      email: 'secretaire.demo@ophthocare.local',
      password: passwordHash,
      firstName: 'Leila',
      lastName: 'Amrani',
      role: UserRole.secretary,
      phoneNumber: '+212600000003',
    },
    update: {
      firstName: 'Leila',
      lastName: 'Amrani',
      role: UserRole.secretary,
      phoneNumber: '+212600000003',
    },
  });

  if (doctorSpace?.id) {
    await prisma.secretaryDoctorSpace.upsert({
      where: { userId: secretaryUser.id },
      create: { userId: secretaryUser.id, doctorSpaceId: doctorSpace.id },
      update: { doctorSpaceId: doctorSpace.id },
    });
  }

  const traineeUser = await prisma.user.upsert({
    where: { email: 'stagiaire.demo@ophthocare.local' },
    create: {
      email: 'stagiaire.demo@ophthocare.local',
      password: passwordHash,
      firstName: 'Youssef',
      lastName: 'El Idrissi',
      role: UserRole.trainee,
      phoneNumber: '+212600000004',
    },
    update: {
      firstName: 'Youssef',
      lastName: 'El Idrissi',
      role: UserRole.trainee,
      phoneNumber: '+212600000004',
    },
  });

  if (doctorSpace?.id) {
    await traineeDoctorSpaceUpsert(prisma, {
      where: { userId: traineeUser.id },
      create: { userId: traineeUser.id, doctorSpaceId: doctorSpace.id },
      update: { doctorSpaceId: doctorSpace.id },
    });
  }

  const patientUser = await prisma.user.upsert({
    where: { email: 'patient.demo@ophthocare.local' },
    create: {
      email: 'patient.demo@ophthocare.local',
      password: passwordHash,
      firstName: 'Ahmed',
      lastName: 'Benali',
      role: UserRole.patient,
      phoneNumber: '+212600000002',
    },
    update: {
      firstName: 'Ahmed',
      lastName: 'Benali',
      phoneNumber: '+212600000002',
    },
  });

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    create: {
      userId: patientUser.id,
      dateOfBirth: new Date('1985-06-15'),
      gender: 'M',
      diagnoses: [{ code: 'H52.0', label: 'Hypermétropie', recordedAt: new Date().toISOString() }],
      allergies: ['Aspirine'],
      address: 'Boulevard Anfa, Casablanca',
      bloodType: 'O+',
      insuranceProvider: 'CNSS',
    },
    update: {
      dateOfBirth: new Date('1985-06-15'),
      gender: 'M',
      diagnoses: [{ code: 'H52.0', label: 'Hypermétropie', recordedAt: new Date().toISOString() }],
      allergies: ['Aspirine'],
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@ophthocare.local' },
    create: {
      email: 'admin@ophthocare.local',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'Plateforme',
      role: UserRole.admin,
      isActive: true,
    },
    update: { role: UserRole.admin, isActive: true },
  });

  await prisma.user.upsert({
    where: { email: 'superadmin@ophthocare.local' },
    create: {
      email: 'superadmin@ophthocare.local',
      password: passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.super_admin,
      isActive: true,
    },
    update: { role: UserRole.super_admin, isActive: true },
  });

  await seedMedications(prisma);

  if (doctorSpace?.id) {
    await seedDemoRichData({
      prisma,
      passwordHash,
      doctor: { id: doctor.id },
      doctorUser: { id: doctorUser.id, email: doctorUser.email },
      doctorSpaceId: doctorSpace.id,
      doctorSiteId: primarySite?.id ?? null,
      secretaryUserId: secretaryUser.id,
      traineeUserId: traineeUser.id,
      mainPatient: { id: patient.id, userId: patientUser.id },
    });
  }

  await prisma.$disconnect();

  console.log(
    [
      '',
      '══════════════════════════════════════════════════════════',
      `  OphthoCare — données de démo (mot de passe : ${DEMO_PASSWORD})`,
      '══════════════════════════════════════════════════════════',
      '',
      '  Médecin (ophtalmo, Casablanca)     dr.demo@ophthocare.local',
      '  Médecin (cardio, Rabat — annuaire) dr.cardio.demo@ophthocare.local',
      '  Secrétaire                         secretaire.demo@ophthocare.local',
      '  Stagiaire                          stagiaire.demo@ophthocare.local',
      '  Patient principal                  patient.demo@ophthocare.local',
      '  Patients additionnels              fatima|karim|nadia|hassan.demo@ophthocare.local',
      '  Admin plateforme                   admin@ophthocare.local',
      '  Super admin                        superadmin@ophthocare.local',
      '',
      '  Données : agenda (passé/aujourd’hui/à venir), consultations,',
      '  dossier clinique, ordonnances, reçus, messagerie, notifications',
      '  patient, imagerie stagiaire, quiz IA, modération avis, audit admin.',
      '',
      '  Pré-consultation publique (ex.) : /pre-consultation/demo-pre-ahmed',
      '  (token exact : voir formulaire lié au RDV « Contrôle annuel »)',
      '',
      '  Connexion pro : /login?intent=pro',
      '  Connexion patient : /login',
      '══════════════════════════════════════════════════════════',
      '',
    ].join('\n'),
  );
}

runSeeds().catch(async (error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
