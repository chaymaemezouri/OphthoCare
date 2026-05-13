import type { Appointment } from '@/types';
import { formatDateTime, formatCurrency } from '@/lib/utils/formatters';

interface AppointmentItemProps {
  appointment: Appointment;
  onCancel?: (id: string) => void;
}

export function AppointmentItem({ appointment, onCancel }: AppointmentItemProps) {
  return (
    <div className="bg-white border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
          </h3>
          <p className="text-gray-600">{appointment.doctor.specialtyCode}</p>

          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>📅 {formatDateTime(appointment.startTime)}</p>
            <p>💰 {formatCurrency(appointment.doctor.consultationPrice)}</p>
            <p>📍 {appointment.type === 'in-person' ? 'Cabinet' : 'Visio'}</p>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              appointment.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {appointment.status === 'confirmed' ? 'Confirmé' : 'En attente'}
          </span>

          {appointment.status === 'pending' && onCancel && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="block mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppointmentSkeleton() {
  return (
    <div className="bg-white border-l-4 border-gray-300 p-4 rounded-r-lg shadow-sm mb-4">
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-40"></div>
      </div>
    </div>
  );
}
