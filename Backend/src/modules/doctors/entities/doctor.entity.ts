import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('doctors')
@Index(['specialtyCode', 'city'], { unique: false })
export class Doctor extends BaseEntity {
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  specialtyCode: string; // 'ophthalmology', 'cardiology', etc.

  @Column({ type: 'simple-array', nullable: true })
  subSpecialties?: string[];

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column()
  city: string;

  @Column()
  street: string;

  @Column()
  postalCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  consultationPrice: number;

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, any>; // { "monday": { "start": "09:00", "end": "18:00" } }

  @Column({ default: false })
  isVerified: boolean;
}
