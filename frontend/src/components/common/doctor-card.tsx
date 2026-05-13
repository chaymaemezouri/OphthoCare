import type { Doctor } from '@/types';
import Link from 'next/link';
import { formatCurrency, getDistanceText, getInitials } from '@/lib/utils/formatters';

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Link href={`/doctor/${doctor.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
              {getInitials(doctor.user.firstName, doctor.user.lastName)}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                Dr. {doctor.user.firstName} {doctor.user.lastName}
              </h3>
              <p className="text-gray-600">{doctor.specialtyCode}</p>
              <p className="text-sm text-gray-500 mt-1">{doctor.city}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="text-right">
            <div className="text-yellow-500 font-semibold">{doctor.rating.toFixed(1)} ★</div>
            <div className="text-sm text-gray-500">{doctor.reviewCount} avis</div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Tarif:</span>
            <p className="font-semibold">{formatCurrency(doctor.consultationPrice)}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-600">Distance:</span>
            <p className="font-semibold">{getDistanceText()}</p>
          </div>
        </div>

        {/* Badge */}
        {doctor.isVerified && (
          <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            ✓ Vérifié
          </div>
        )}
      </div>
    </Link>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      </div>
    </div>
  );
}
