"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Sparkles, 
  Lightbulb, 
  Search, 
  Send, 
  BrainCircuit, 
  FileText, 
  BookOpen,
  ArrowRight,
  MessageSquare,
  History,
  Info,
  ChevronRight,
  Stethoscope,
  Eye,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const suggestions = [
  "Analyser les clichés OCT de Marie Laurent",
  "Rédiger un compte-rendu pour le patient Robert Leroy",
  "Comparer l'évolution du glaucome (SB-2026)",
  "Rechercher les protocoles post-opératoires Laser"
];

const chatHistory = [
  { 
    role: "user", 
    content: "Quelle est l'interprétation habituelle d'une excavation papillaire à 0.8 ?",
    time: "14:30"
  },
  { 
    role: "assistant", 
    content: "Une excavation papillaire (Cup/Disk ratio) à 0.8 est considérée comme suspecte de glaucome. Il est recommandé de corréler ce signe avec :\n1. Une mesure de la PIO\n2. Une pachymétrie cornéenne\n3. Un champ visuel (Automatisé)\n4. Un RNFL par OCT",
    time: "14:31"
  }
];

export default function AIAssistantPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-8 h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-end justify-between shrink-0">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Assistant IA OphthoCare
              <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-md px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-tighter">Bêta v2.0</Badge>
            </h2>
            <p className="text-[13px] text-slate-500 font-medium">Aide au diagnostic, analyse d'imagerie et formation continue</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <History className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Historique
            </Button>
            <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-all shadow-sm">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Nouvelle Analyse
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-4",
                  msg.role === "assistant" ? "bg-slate-50/50 p-6 rounded-2xl border border-slate-50" : ""
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border",
                    msg.role === "assistant" ? "bg-white border-slate-100 text-slate-900" : "bg-slate-900 border-slate-900 text-white"
                  )}>
                    {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[14px] leading-relaxed text-slate-800 whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="max-w-3xl mx-auto relative group">
                <Input 
                  placeholder="Posez une question clinique ou analysez un dossier..." 
                  className="pl-4 pr-12 h-12 bg-slate-50 border-none rounded-xl w-full text-[14px] focus-visible:ring-1 focus-visible:ring-slate-200 transition-all shadow-inner"
                />
                <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {suggestions.map((s, i) => (
                  <button key={i} className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Knowledge Base & Tools */}
          <div className="w-80 space-y-6 shrink-0 overflow-y-auto custom-scrollbar pr-1">
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-slate-50">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="h-3.5 w-3.5 text-emerald-500" />
                  Outils de Diagnostic
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-[12px] font-semibold">Analyse Rétinienne</span>
                  <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-[12px] font-semibold">Calcul de PIO Corrigée</span>
                  <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span className="text-[12px] font-semibold">Générateur de Rapport</span>
                  <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-4 border-b border-slate-50">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                  Base de Connaissances
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  {[
                    "Protocoles Chirurgie Cataracte",
                    "Classification DMLA 2026",
                    "Guide Prescription Myopie"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 cursor-pointer group">
                      <div className="h-2 w-2 rounded-full bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                      <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{item}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full h-9 rounded-xl border-slate-100 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
                  Explorer la base
                </Button>
              </CardContent>
            </Card>

            <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Info className="h-16 w-16" />
              </div>
              <p className="text-[13px] font-bold leading-relaxed relative z-10">L'IA est un outil d'aide à la décision. La responsabilité clinique incombe au médecin traitant.</p>
              <Button className="w-full bg-white text-slate-900 h-9 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-100 relative z-10">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
