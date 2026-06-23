'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { documentsApi } from '@/lib/api/documents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function VerifyDocumentPage() {
  const params = useParams<{ type: string; uuid: string }>();
  const [result, setResult] = useState<{ isValid: boolean; doctorName: string; documentDate: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const type = params.type;
    const uuid = params.uuid;
    if (!type || !uuid) return;
    documentsApi
      .verifyPublic(type, uuid)
      .then(setResult)
      .catch(() => setError(true));
  }, [params.type, params.uuid]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Vérification OphthoCare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <p className="text-sm text-red-700">Document introuvable ou invalide.</p>
          ) : !result ? (
            <p className="text-sm text-slate-500">Vérification en cours…</p>
          ) : (
            <>
              <Badge className="bg-emerald-600">Authentique</Badge>
              <p className="text-sm">
                <strong>Médecin :</strong> {result.doctorName}
              </p>
              <p className="text-sm">
                <strong>Date du document :</strong>{' '}
                {new Date(result.documentDate).toLocaleString('fr-FR')}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
