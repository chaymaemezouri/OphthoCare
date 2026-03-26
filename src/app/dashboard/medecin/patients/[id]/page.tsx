"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, 
  Activity, 
  Plus, 
  Printer,
  ChevronLeft,
  Calendar,
  Heart,
  Pill,
  Image as ImageIcon,
  ArrowRight,
  Stethoscope,
  FileText,
  ChevronRight,
  Mic,
  ClipboardCheck
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { use, useState } from "react";
import { cn } from "@/lib/utils";
import { AIImagingViewer } from "@/components/medical/ai-imaging-viewer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function PatientDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [showAIViewer, setShowAIViewer] = useState(false);
  const [selectedExam, setSelectedExam] = useState<{ title: string; date: string } | null>(null);
  
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* AI Viewer Modal */}
        {showAIViewer && selectedExam && (
          <AIImagingViewer 
            title={selectedExam.title} 
            date={selectedExam.date} 
            onClose={() => setShowAIViewer(false)} 
          />
        )}
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="h-9 w-9 border border-slate-100 bg-white rounded-lg text-slate-400 hover:text-slate-900 shadow-sm" asChild>
              <Link href="/dashboard/medecin/patients">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Marie Laurent</h2>
                <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-md px-2 py-0.5 font-bold text-[9px] uppercase tracking-tighter">Actif</Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                ML-2026-001 • 42 ans • Femme
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Export Center Improvement */}
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-[12px] font-bold bg-white gap-2">
                  <Printer className="h-4 w-4 text-slate-400" />
                  Export Center
                </Button>
              } />
              <PopoverContent align="end" className="w-72 p-4 bg-white border-slate-100 shadow-2xl rounded-2xl">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Générer Dossier PDF</h3>
                <div className="space-y-2">
                  {[
                    { name: "Dossier Complet (Pro)", icon: FileText, size: "4.2 MB" },
                    { name: "Synthèse Patient", icon: ClipboardCheck, size: "1.1 MB" },
                    { name: "Imagerie HD (DICOM)", icon: ImageIcon, size: "45 MB" },
                  ].map((opt, i) => (
                    <Button key={i} variant="ghost" className="w-full justify-start h-12 rounded-xl hover:bg-slate-50 gap-3 border border-transparent hover:border-slate-100 transition-all">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <opt.icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-[12px] font-bold text-slate-900">{opt.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{opt.size}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Consultation
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <div className="p-8 flex flex-col items-center border-b border-slate-50">
                <Avatar className="h-20 w-20 border-2 border-slate-50 shadow-md mb-4">
                  <AvatarFallback className="bg-slate-900 text-white font-bold text-xl">ML</AvatarFallback>
                </Avatar>
                <h3 className="text-[15px] font-bold text-slate-900">Marie Laurent</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Patiente depuis 2022</p>
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Âge</p>
                    <p className="text-sm font-bold text-slate-900">42 ans</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Groupe</p>
                    <p className="text-sm font-bold text-slate-900">A+</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[12px] font-medium text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-300" />
                    12 Mai 1984
                  </div>
                  <div className="flex items-center gap-3 text-[12px] font-medium text-slate-600">
                    <Heart className="h-4 w-4 text-rose-300" />
                    Allergie : Pénicilline
                  </div>
                  <div className="flex items-center gap-3 text-[12px] font-medium text-slate-600">
                    <Pill className="h-4 w-4 text-blue-300" />
                    Suivi : Myopie forte
                  </div>
                </div>
                <Button variant="ghost" className="w-full h-9 mt-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-900 border border-slate-50">
                  Modifier le profil
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm bg-slate-900 text-white p-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Dernier Examen</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OD</span>
                  <span className="text-lg font-bold">-3.25 (-0.75) 90°</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OG</span>
                  <span className="text-lg font-bold">-3.50 (-0.50) 85°</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-8 mb-6">
                {["Vue d'ensemble", "Historique", "Examens", "Ordonnances"].map((tab) => (
                  <TabsTrigger 
                    key={tab}
                    value={tab === "Vue d'ensemble" ? "overview" : tab.toLowerCase()} 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-50 py-4 px-6">
                      <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <History className="h-3.5 w-3.5" />
                        Consultations Récentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-50">
                        {[
                          { date: "26/03/2026", type: "Contrôle", dr: "Dr. Dupont" },
                          { date: "15/01/2026", type: "Réfraction", dr: "Dr. Dupont" },
                        ].map((visit, i) => (
                          <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-colors">
                            <div>
                              <p className="text-[13px] font-bold text-slate-900">{visit.type}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{visit.date} • {visit.dr}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-50 py-4 px-6">
                      <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Imagerie
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { title: "OCT Macula", date: "Jan 2026" },
                          { title: "Rétino", date: "Jan 2026" },
                        ].map((exam, i) => (
                          <div 
                            key={i} 
                            className="aspect-square rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center p-4 group cursor-pointer hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                            onClick={() => {
                              setSelectedExam(exam);
                              setShowAIViewer(true);
                            }}
                          >
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-slate-50 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-all">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 mt-1">{exam.title}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{exam.date}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-slate-100 shadow-sm">
                  <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Synthèse Clinique
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-400 hover:text-rose-600 gap-2 px-2">
                      <Mic className="h-3 w-3" />
                      Dictée vocale
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="p-5 rounded-xl bg-slate-50/50 border border-slate-100">
                      <p className="text-[13px] text-slate-700 font-medium leading-relaxed italic">
                        "Patiente avec myopie forte stabilisée. Suivi régulier pour tension oculaire limite. 
                        Prescription renouvelée ce jour. Prochain contrôle dans 6 mois."
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dernière mise à jour par Dr. Dupont</p>
                        <Badge variant="ghost" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0">26/03/2026</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
