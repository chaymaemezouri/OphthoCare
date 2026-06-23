export type DoctorStaffRole = 'secretary' | 'trainee';

export type DoctorStaffMember = {
  linkId: string;
  userId: string;
  role: DoctorStaffRole;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  lang: string;
  createdAt: string;
  dashboardPath: string;
  loginUrl: string;
};

export type DoctorStaffListResponse = {
  doctorSpaceId: string;
  doctorSpaceName: string;
  staff: DoctorStaffMember[];
};

export type CreateDoctorStaffResponse = {
  doctorSpaceName: string;
  member: {
    userId: string;
    role: DoctorStaffRole;
    email: string;
    firstName: string | null;
    lastName: string | null;
    dashboardPath: string;
    loginUrl: string;
  };
  credentials: {
    email: string;
    temporaryPassword: string;
    message: string;
  };
};
