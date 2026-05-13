import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema001 implements MigrationInterface {
  name = 'InitialSchema001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'doctor', 'patient', 'secretary', 'trainee')`);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', isGenerated: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
          { name: 'email', type: 'varchar', isNullable: false },
          { name: 'password', type: 'varchar', isNullable: false },
          { name: 'firstName', type: 'varchar', isNullable: true },
          { name: 'lastName', type: 'varchar', isNullable: true },
          { name: 'role', type: 'enum', enumName: 'users_role_enum', enum: ['admin', 'doctor', 'patient', 'secretary', 'trainee'], default: `'patient'` },
          { name: 'twoFactorEnabled', type: 'boolean', default: false },
          { name: 'phoneNumber', type: 'varchar', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      }),
    );

    await queryRunner.createIndex('users', new TableIndex({ name: 'IDX_users_email', columnNames: ['email'], isUnique: true }));

    await queryRunner.createTable(
      new Table({
        name: 'specialties',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', isGenerated: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
          { name: 'code', type: 'varchar', isUnique: true },
          { name: 'name', type: 'varchar' },
          { name: 'description', type: 'varchar', isNullable: true },
          { name: 'icon', type: 'varchar', isNullable: true },
          { name: 'defaultFields', type: 'jsonb', isNullable: true },
          { name: 'doctorCount', type: 'int', default: 0 },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'doctors',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', isGenerated: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
          { name: 'specialtyCode', type: 'varchar' },
          { name: 'subSpecialties', type: 'text', isNullable: true },
          { name: 'licenseNumber', type: 'varchar', isNullable: true },
          { name: 'bio', type: 'varchar', isNullable: true },
          { name: 'rating', type: 'decimal', precision: 3, scale: 2, default: 0 },
          { name: 'reviewCount', type: 'int', default: 0 },
          { name: 'city', type: 'varchar' },
          { name: 'street', type: 'varchar' },
          { name: 'postalCode', type: 'varchar' },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'longitude', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'consultationPrice', type: 'decimal', precision: 8, scale: 2, default: 0 },
          { name: 'workingHours', type: 'jsonb', isNullable: true },
          { name: 'isVerified', type: 'boolean', default: false },
          { name: 'userId', type: 'uuid', isNullable: true, isUnique: true },
        ],
      }),
    );

    await queryRunner.createIndex('doctors', new TableIndex({ name: 'IDX_doctors_specialty_city', columnNames: ['specialtyCode', 'city'] }));
    await queryRunner.createForeignKey(
      'doctors',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'patients',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', isGenerated: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
          { name: 'dateOfBirth', type: 'date', isNullable: true },
          { name: 'gender', type: 'varchar', isNullable: true },
          { name: 'nationalId', type: 'varchar', isNullable: true },
          { name: 'medicalData', type: 'jsonb', isNullable: true },
          { name: 'insuranceProvider', type: 'varchar', isNullable: true },
          { name: 'insuranceNumber', type: 'varchar', isNullable: true },
          { name: 'familyMembers', type: 'jsonb', isNullable: true },
          { name: 'userId', type: 'uuid', isNullable: true, isUnique: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'patients',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('patients');
    await queryRunner.dropTable('doctors');
    await queryRunner.dropTable('specialties');
    await queryRunner.dropIndex('users', 'IDX_users_email');
    await queryRunner.dropTable('users');
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}