"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, ClipboardList } from "lucide-react";
import { AiLearning } from "@/components/ai/ai-learning";
import { AiQuiz } from "@/components/ai/ai-quiz";

export default function StagiaireCliniquePage() {
  return (
    <DashboardLayout role="stagiaire">
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Suivi d&apos;apprentissage</h2>
            <p className="text-[13px] text-slate-500 font-medium">
              Progression, quiz IA et accès aux dossiers patients (lecture seule)
            </p>
          </div>
          <Button
            asChild
            className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold"
          >
            <Link href="/dashboard/stagiaire/patients">
              <Users className="mr-2 h-3.5 w-3.5" />
              Dossiers patients
            </Link>
          </Button>
        </div>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-50 py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-slate-400" />
              Ma progression
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <AiLearning />
          </CardContent>
        </Card>

        <AiQuiz />

        <Card className="border-slate-100 bg-slate-50/30">
          <CardContent className="p-5 flex items-start gap-3 text-sm text-slate-600">
            <ClipboardList className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
            <p>
              Les explications d&apos;examens (OCT, fond d&apos;œil…) sont disponibles dans l&apos;onglet{' '}
              <strong>Imagerie & explications</strong> de chaque dossier patient.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
