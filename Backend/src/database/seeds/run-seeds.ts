import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '@/config/database.config';
import { Specialty } from '@/modules/specialties/entities/specialty.entity';
import { SPECIALTIES_SEED } from './specialties.seed';

async function runSeeds() {
  const dataSource = new DataSource(databaseConfig() as DataSourceOptions);

  await dataSource.initialize();

  const specialtyRepository = dataSource.getRepository(Specialty);

  for (const specialtyData of SPECIALTIES_SEED) {
    const existing = await specialtyRepository.findOne({ where: { code: specialtyData.code } });
    const specialty = specialtyRepository.create({
      ...existing,
      ...specialtyData,
    });

    await specialtyRepository.save(specialty);
  }

  await dataSource.destroy();
  console.log(`Seeded ${SPECIALTIES_SEED.length} specialties`);
}

runSeeds().catch(async (error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});