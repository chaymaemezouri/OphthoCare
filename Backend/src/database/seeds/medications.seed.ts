import type { PrismaClient } from '@prisma/client';

const MEDS: Array<{ name: string; genericName?: string; form?: string; dosages: string[] }> = [
  { name: 'Paracétamol', genericName: 'Acétaminophène', form: 'comprimé', dosages: ['500 mg', '1 g'] },
  { name: 'Ibuprofène', form: 'comprimé', dosages: ['200 mg', '400 mg'] },
  { name: 'Amoxicilline', form: 'gélule', dosages: ['500 mg', '1 g'] },
  { name: 'Azithromycine', form: 'comprimé', dosages: ['250 mg', '500 mg'] },
  { name: 'Oméprazole', form: 'gélule', dosages: ['20 mg'] },
  { name: 'Metformine', form: 'comprimé', dosages: ['500 mg', '850 mg', '1 g'] },
  { name: 'Amlodipine', form: 'comprimé', dosages: ['5 mg', '10 mg'] },
  { name: 'Atorvastatine', form: 'comprimé', dosages: ['10 mg', '20 mg', '40 mg'] },
  { name: 'Salbutamol', form: 'sirop', dosages: ['2 mg/5 ml'] },
  { name: 'Prednisolone', form: 'comprimé', dosages: ['5 mg', '20 mg'] },
  { name: 'Timolol collyre', genericName: 'Timolol', form: 'collyre', dosages: ['0,5 %'] },
  { name: 'Latanoprost collyre', form: 'collyre', dosages: ['0,005 %'] },
  { name: 'Dorzolamide collyre', form: 'collyre', dosages: ['2 %'] },
  { name: 'Doliprane', genericName: 'Paracétamol', form: 'comprimé', dosages: ['1000 mg'] },
  { name: 'Augmentin', genericName: 'Amoxicilline + acide clavulanique', form: 'comprimé', dosages: ['1 g'] },
];

export async function seedMedications(prisma: PrismaClient) {
  for (const m of MEDS) {
    const existing = await prisma.medication.findFirst({ where: { name: m.name } });
    if (existing) continue;
    await prisma.medication.create({
      data: {
        name: m.name,
        genericName: m.genericName ?? null,
        form: m.form ?? null,
        dosages: m.dosages,
        countryTags: ['FR', 'MA'],
      },
    });
  }
}
