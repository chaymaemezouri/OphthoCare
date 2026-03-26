"use client"

import * as React from "react"
import { 
  Calendar, 
  FileText, 
  Clock, 
  User, 
  ChevronRight, 
  Plus, 
  Video, 
  MessageSquare,
  ArrowLeft,
  Settings,
  Bell,
  Download,
  Info,
  Pill,
  ClipboardCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function PatientPortalPage() {
  const [showQuestionnaire, setShowQuestionnaire] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-900 selection:text-white pb-20">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs italic">O</span>
            </div>
            <span className="text-[14px] font-black tracking-tighter uppercase italic text-slate-900">OphthoCare</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-400">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
            ML
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome Section */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight italic">Bonjour, Marie</h1>
            <p className="text-[13px] text-slate-500 font-medium">Bienvenue dans votre espace santé OphthoCare.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Family Management - IMPROVEMENT */}
            <div className="hidden md:flex items-center bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
              <Button variant="ghost" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-900 rounded-lg">Moi</Button>
              <Button variant="ghost" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Enfants</Button>
              <Button variant="ghost" className="h-8 px-2 text-slate-300 hover:text-slate-900"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            <Button className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
              <Plus className="mr-2 h-4 w-4" />
              Prendre RDV
            </Button>
          </div>
        </div>

        <Tabs defaultValue="home" className="w-full">
          <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start rounded-none h-auto p-0 gap-8 mb-8 overflow-x-auto custom-scrollbar scrollbar-hide">
            <TabsTrigger value="home" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all">Tableau de bord</TabsTrigger>
            <TabsTrigger value="treatments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all">Mes Traitements</TabsTrigger>
            <TabsTrigger value="docs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 text-[12px] font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all">Mes Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-10 animate-in fade-in duration-500">
            {/* Pre-consultation Questionnaire Alert - IMPROVEMENT */}
            <Card className="border-none bg-emerald-50 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ClipboardCheck className="h-16 w-16 text-emerald-600" />
              </div>
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="space-y-1 text-center md:text-left">
                  <h3 className="text-[15px] font-bold text-emerald-900 flex items-center justify-center md:justify-start gap-2">
                    <Zap className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                    Préparez votre visite de lundi
                  </h3>
                  <p className="text-[12px] text-emerald-700 font-medium">Remplissez votre questionnaire de symptômes pour gagner 10 min en cabinet.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-none h-9 px-6 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-md">
                  Remplir le questionnaire
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Next Appointment Card */}
              <Card className="md:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group">
                <CardContent className="p-0 flex flex-col md:flex-row h-full">
                  <div className="p-8 space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md">Confirmé</Badge>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prochain RDV</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">Dr. Thomas Martin</h3>
                      <p className="text-[13px] text-slate-500 font-medium">Ophtalmologue • Cabinet Centre-Ville</p>
                    </div>
                    <div className="flex items-center gap-8 pt-2">
                      <div className="flex items-center gap-3 text-slate-900">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-[13px] font-bold">Lundi 30 Mars</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-900">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-[13px] font-bold">14:30</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-8 flex flex-col justify-center border-l border-slate-100 gap-3">
                    <Button className="w-full bg-white text-slate-900 border border-slate-200 h-10 rounded-xl text-[12px] font-bold hover:bg-slate-50">Modifier</Button>
                    <Button variant="ghost" className="w-full text-rose-500 h-10 rounded-xl text-[12px] font-bold hover:bg-rose-50 hover:text-rose-600">Annuler</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Sidebar */}
              <div className="space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Video className="h-12 w-12" />
                  </div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 relative z-10">Téléconsultation</h4>
                  <p className="text-[13px] font-bold leading-relaxed mb-6 relative z-10 italic">Besoin d'un avis rapide ? Lancez une consultation vidéo.</p>
                  <Button className="w-full bg-white text-slate-900 h-10 rounded-xl text-[12px] font-bold hover:bg-slate-100 relative z-10">Démarrer</Button>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">Messagerie</p>
                      <p className="text-[11px] text-slate-500 font-medium">Contacter le cabinet</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="treatments" className="space-y-6 animate-in fade-in duration-500">
            {/* Gouttes & Treatment Tracking - IMPROVEMENT */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 italic">Mes Rappels Collyres</h3>
                    <p className="text-[12px] text-slate-500 font-medium">Suivi de votre traitement quotidien</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <Pill className="h-6 w-6" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: "Monoprost 50µg", time: "08:00", eye: "ODG", status: "pris" },
                    { name: "Monoprost 50µg", time: "20:00", eye: "ODG", status: "attente" },
                  ].map((med, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center border",
                          med.status === "pris" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-slate-200 text-slate-400"
                        )}>
                          {med.status === "pris" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{med.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{med.eye} • {med.time}</p>
                        </div>
                      </div>
                      {med.status === "attente" && (
                        <Button className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">Valider</Button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full h-12 border-2 border-dashed border-slate-100 rounded-2xl text-[12px] font-bold text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un rappel
                  </Button>
                </div>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white p-8 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 p-8 opacity-5">
                  <Info className="h-32 w-32" />
                </div>
                <h3 className="text-lg font-bold mb-4 italic">Conseil Médical</h3>
                <p className="text-[14px] font-medium leading-relaxed text-slate-300 mb-8">
                  "L'observance de votre traitement est la clé pour stabiliser votre tension oculaire. 
                  N'oubliez pas vos gouttes, même en voyage."
                </p>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Stock Collyres</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[13px] font-bold">Reste 12 jours</p>
                    <Link href="#" className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4">Renouveler</Link>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="animate-in fade-in duration-500">
            <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-slate-900 italic">Historique Médical</CardTitle>
                  <p className="text-[12px] text-slate-500 font-medium">Consultez et téléchargez vos documents</p>
                </div>
                <Button variant="outline" className="h-9 rounded-xl border-slate-200 text-[11px] font-bold uppercase tracking-widest">Filtrer</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {[
                    { name: "Ordonnance Lunettes", date: "26/03/2026", type: "PDF", doctor: "Dr. Martin" },
                    { name: "Compte-rendu OCT", date: "15/01/2026", type: "PDF", doctor: "Dr. Dupont" },
                    { name: "Certificat Médical", date: "15/01/2026", type: "PDF", doctor: "Dr. Dupont" },
                    { name: "Facture F-2026-042", date: "15/01/2026", type: "PDF", doctor: "Cabinet" },
                  ].map((doc, i) => (
                    <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors shadow-sm">
                          <Download className="h-5 w-5 text-slate-400 group-hover:text-slate-900" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{doc.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{doc.date} • {doc.doctor}</p>
                        </div>
                      </div>
                      <Badge variant="ghost" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-slate-900">{doc.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Nav Mobile Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-16 flex items-center justify-around px-4 z-50 shadow-lg">
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-slate-900">
          <User className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Moi</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-slate-400">
          <Calendar className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">RDV</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-slate-400">
          <MessageSquare className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Messages</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-slate-400">
          <Settings className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Profil</span>
        </Button>
      </nav>
    </div>
  )
}
