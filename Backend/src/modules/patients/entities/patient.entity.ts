import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('patients')
export class Patient extends BaseEntity {
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string; // 'male', 'female', 'other'

  @Column({ nullable: true })
  nationalId: string;

  @Column({ type: 'jsonb', nullable: true })
  medicalData: {
    allergies?: string[];
    bloodGroup?: string;
    chronicDiseases?: string[];
    medications?: Array<{ name: string; dosage: string; duration: string }>;
  };

  @Column({ nullable: true })
  insuranceProvider: string;

  @Column({ nullable: true })
  insuranceNumber: string;

  @Column({ type: 'jsonb', nullable: true })
  familyMembers?: Array<{
    name: string;
    relationship: string;
    dateOfBirth: string;
  }>;
}
