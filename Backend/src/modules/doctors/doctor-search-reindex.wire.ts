import { Injectable, OnModuleInit } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsSpaceService } from './doctors-space.service';

/** Branche les mutations espace cabinet sur la réindexation Elasticsearch. */
@Injectable()
export class DoctorSearchReindexWire implements OnModuleInit {
  constructor(
    private readonly doctors: DoctorsService,
    private readonly space: DoctorsSpaceService,
  ) {}

  onModuleInit(): void {
    this.space.attachSearchReindex((doctorId) => {
      void this.doctors.reindexDoctorInSearchEngines(doctorId);
    });
  }
}
