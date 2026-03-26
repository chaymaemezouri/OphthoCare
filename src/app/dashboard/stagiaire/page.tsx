"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Send, 
  Sparkles, 
  History,
  MoreVertical,
  Paperclip,
  Mic,
  Eye,
  Activity,
  ChevronRight,
  BookOpen,
  Brain
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const recentChats = [
  { id: 1, title: "Diagnostic Glaucome", date: "2h", icon: Eye },
  { id: 2, title: "Interprétation OCT", date: "Hier", icon: Activity },
  { id: 3, title: "Cas Cataracte", date: "2j", icon: Brain },
];

export default function IAAssistantPage() {
  const [messages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis votre assistant médical IA. Comment puis-je vous aider dans votre apprentissage aujourd'hui ?" },
    { role: "user", content: "Quels sont les signes précoces d'un décollement de rétine ?" },
    { role: "assistant", content: "Les signes précoces incluent l'apparition soudaine de corps flottants, des flashs lumineux (phosphènes) et une sensation de voile noir. C'est une urgence absolue." },
  ]);

  return (
    <DashboardLayout role="stagiaire">
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex gap-6">
        {/* Left Sidebar: History */}
        <div className="w-64 hidden xl:flex flex-col gap-6">
          <Card className="flex-1 border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Historique
              </h3>
            </div>
            <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
              {recentChats.map((chat) => (
                <div key={chat.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group">
                  <chat.icon className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 truncate">{chat.title}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{chat.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-slate-100 shadow-sm bg-slate-900 text-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
              <h3 className="text-[12px] font-bold uppercase tracking-tight">Mode Expert</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4">
              Analyse basée sur les publications de l'AAO 2025.
            </p>
            <Button variant="outline" className="w-full h-8 rounded-lg border-white/10 bg-white/5 text-[11px] font-bold hover:bg-white/10 text-white">
              Changer de mode
            </Button>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <Card className="flex-1 border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col">
            <div className="p-4 px-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900">Assistant IA Médical</h2>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" /> En ligne
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-4",
                  m.role === "user" ? "flex-row-reverse" : ""
                )}>
                  <Avatar className={cn(
                    "h-8 w-8 border border-slate-100 shrink-0 mt-1",
                    m.role === "assistant" ? "bg-slate-900" : "bg-slate-50"
                  )}>
                    <AvatarFallback className={cn(
                      "text-[10px] font-bold",
                      m.role === "assistant" ? "text-white" : "text-slate-400"
                    )}>
                      {m.role === "assistant" ? <Bot className="h-4 w-4" /> : "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "max-w-[75%] p-4 rounded-xl text-[12px] font-medium leading-relaxed shadow-sm",
                    m.role === "assistant" 
                      ? "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100" 
                      : "bg-slate-900 text-white rounded-tr-none"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-50 bg-white">
              <div className="relative group">
                <Input 
                  placeholder="Posez une question clinique..." 
                  className="pl-4 pr-24 h-12 bg-slate-50 border-none rounded-xl text-[12px] font-medium focus-visible:ring-1 focus-visible:ring-slate-200 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900">
                    <Paperclip className="h-3.5 w-3.5" />
                  </Button>
                  <Button className="h-8 w-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm p-0 flex items-center justify-center">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest mt-4">
                IA à visée pédagogique • Vérifiez les sources cliniques
              </p>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Resources */}
        <div className="w-64 hidden 2xl:flex flex-col gap-6">
          <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                Ressources
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {[
                "Atlas Pathologies",
                "Protocoles Urgences",
                "Pharmacopée",
              ].map((res, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group">
                  <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{res}</span>
                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-slate-900 transition-all" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
