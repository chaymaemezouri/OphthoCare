'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Doctor } from '@/types';

const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
if (typeof window !== 'undefined' && '_getIconUrl' in proto) {
  delete proto._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function DoctorsMapInner({ doctors }: { doctors: Doctor[] }) {
  const withCoords = useMemo(
    () => doctors.filter((d) => d.latitude != null && d.longitude != null),
    [doctors]
  );

  const center = useMemo((): [number, number] => {
    if (withCoords.length === 0) return [33.5731, -7.5898];
    const lat = withCoords.reduce((a, d) => a + Number(d.latitude), 0) / withCoords.length;
    const lng = withCoords.reduce((a, d) => a + Number(d.longitude), 0) / withCoords.length;
    return [lat, lng];
  }, [withCoords]);

  if (withCoords.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-[#E8EAED]/80 bg-[#F8F8F6]/80 px-6 text-center text-sm leading-relaxed text-[#77777D]">
        Aucune coordonnée GPS pour ces praticiens. La liste reste disponible ; le cabinet peut ajouter latitude /
        longitude sur son profil.
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={withCoords.length === 1 ? 13 : 11}
      className="z-0 h-[300px] w-full overflow-hidden rounded-[24px] border border-[#E8EAED]/80 shadow-[0_8px_40px_rgba(15,23,42,0.04)]"
      scrollWheelZoom
    >
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {withCoords.map((d) => (
        <Marker key={d.id} position={[Number(d.latitude), Number(d.longitude)]}>
          <Popup>
            <div className="min-w-[10rem] text-sm">
              <p className="font-semibold text-slate-900">
                Dr. {d.user.firstName} {d.user.lastName}
              </p>
              <p className="text-slate-600">{d.specialtyName ?? d.specialtyCode}</p>
              <p className="text-slate-500">{d.city}</p>
              <Link href={`/doctor/${d.id}`} className="mt-1 inline-block font-medium text-[#111111] hover:underline">
                Voir le profil
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
