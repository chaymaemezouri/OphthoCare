"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { adminApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function AdminSecurityPage() {
  useRequireAuth();
  const [audit, setAudit] = useState<Awaited<ReturnType<typeof adminApi.listAuditLogs>> | null>(null);
  const [failed, setFailed] = useState<Awaited<ReturnType<typeof adminApi.failedLogins>>>([]);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof adminApi.activeSessions>>>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, f, s] = await Promise.all([
        adminApi.listAuditLogs({
          action: actionFilter || undefined,
          dateFrom: dateFrom || undefined,
          page: 1,
          take: 80,
        }),
        adminApi.failedLogins(),
        adminApi.activeSessions(),
      ]);
      setAudit(a);
      setFailed(f);
      setSessions(s);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateFrom]);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (id: string) => {
    if (!window.confirm("Révoquer cette session ?")) return;
    await adminApi.revokeSession(id);
    void load();
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sécurité & audit</h2>
          <p className="text-sm text-slate-500">Journaux sans contenu médical — identifiants patients hachés</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Journal d&apos;audit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Action (ex. VIEW_PATIENT)"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="max-w-[160px]"
                  />
                  <Button size="sm" onClick={() => void load()}>
                    Filtrer
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Action</th>
                        <th className="p-2 text-left">Utilisateur</th>
                        <th className="p-2 text-left">Entité (hash)</th>
                        <th className="p-2 text-left">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit?.items.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="p-2">{new Date(row.createdAt).toLocaleString("fr-FR")}</td>
                          <td className="p-2 font-mono">{row.action}</td>
                          <td className="p-2">{row.userDisplayName || row.userEmail || "—"}</td>
                          <td className="p-2 font-mono truncate max-w-[120px]">{row.entityIdHash ?? "—"}</td>
                          <td className="p-2">{row.ip ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tentatives suspectes (7 j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {failed.length === 0 ? (
                    <p className="text-slate-500">Aucune tentative échouée récente.</p>
                  ) : (
                    failed.map((g) => (
                      <div
                        key={g.ip}
                        className="flex justify-between gap-4 border border-slate-100 rounded-lg px-3 py-2"
                      >
                        <span className="font-mono">{g.ip}</span>
                        <span>{g.count} tentatives</span>
                        <span className="text-slate-500 truncate">{g.emails.join(", ")}</span>
                        <span className="text-slate-400 text-xs">
                          {new Date(g.lastAttemptAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2"
                    >
                      <span>
                        {s.userDisplayName || s.userEmail} · {s.role}
                      </span>
                      <span className="text-slate-500">
                        {s.browser ?? "—"} · {s.ip ?? "—"} · {new Date(s.createdAt).toLocaleString("fr-FR")}
                      </span>
                      <Button size="sm" variant="destructive" onClick={() => void revoke(s.id)}>
                        Révoquer
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

