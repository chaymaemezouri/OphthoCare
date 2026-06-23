'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MessagingPanel } from '@/components/common/MessagingPanel';
import { ReceiptManager } from '@/components/documents/ReceiptManager';
import { useRequireAuth } from '@/hooks/use-auth';

export default function SecretaireCommPage() {
  useRequireAuth();
  return (
    <DashboardLayout role="secretaire">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Messagerie patients</h2>
          <p className="text-sm text-slate-500">Toutes les conversations du cabinet</p>
        </div>
        <MessagingPanel />
        <ReceiptManager />
      </div>
    </DashboardLayout>
  );
}
