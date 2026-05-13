import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

@Entity('specialties')
export class Specialty extends BaseEntity {
  @Column({ unique: true })
  code: string; // 'ophthalmology', 'cardiology', etc.

  @Column()
  name: string; // 'Ophtalmologie', 'Cardiologie'

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultFields: string[]; // Template fields for this specialty

  @Column({ default: 0 })
  doctorCount: number;
}
