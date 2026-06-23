import { redirect } from 'next/navigation';

export default function PatientAppointmentsRedirectPage() {
  redirect('/dashboard/patient/bookings');
}
