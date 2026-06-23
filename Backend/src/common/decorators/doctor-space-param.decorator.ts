import { SetMetadata } from '@nestjs/common';

/** Nom du param route à comparer à `req.user.doctorSpaceId` (ex. `'id'` pour `GET /doctors/:id`). */
export const DOCTOR_SPACE_PARAM_KEY = 'doctorSpaceParam';

export const SameDoctorSpace = (paramName = 'id') => SetMetadata(DOCTOR_SPACE_PARAM_KEY, paramName);
