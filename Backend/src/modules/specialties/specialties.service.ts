import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialty } from './entities/specialty.entity';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(Specialty)
    private readonly specialtiesRepository: Repository<Specialty>,
  ) {}

  async findAll(): Promise<Specialty[]> {
    return this.specialtiesRepository.find({ order: { name: 'ASC' } });
  }

  async findByCode(code: string): Promise<Specialty> {
    const specialty = await this.specialtiesRepository.findOne({ where: { code } });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return specialty;
  }

  async seedSpecialties(records: Partial<Specialty>[]): Promise<Specialty[]> {
    const saved: Specialty[] = [];

    for (const record of records) {
      const existing = await this.specialtiesRepository.findOne({ where: { code: record.code } });
      const specialty = this.specialtiesRepository.create({
        ...existing,
        ...record,
      });
      saved.push(await this.specialtiesRepository.save(specialty));
    }

    return saved;
  }
}