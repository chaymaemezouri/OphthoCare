"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Settings,
  MoreVertical,
  Maximize2,
  FileText,
  Share2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TeleconsultationPage() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
              <Video className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-none">Téléconsultation en direct</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Patient : Sophie Bernard • Durée : 12:45
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <FileText className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Prendre des notes
            </Button>
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <Share2 className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Partager l'écran
            </Button>
          </div>
        </div>

        {/* Main Video Area */}
        <div className="flex-1 flex gap-6 min-h-0">
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            {/* Patient Video Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar className="h-32 w-32 border-4 border-slate-800 shadow-2xl">
                <AvatarFallback className="bg-slate-800 text-slate-500 text-4xl font-bold">SB</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-[11px] font-bold text-white">Sophie Bernard</span>
                <Mic className="h-3 w-3 text-white/60" />
              </div>
            </div>

            {/* Doctor Self Preview */}
            <div className="absolute top-6 right-6 w-48 aspect-video rounded-xl overflow-hidden bg-slate-800 border border-white/10 shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                {isVideoOff ? (
                  <VideoOff className="h-6 w-6 text-slate-600" />
                ) : (
                  <Avatar className="h-12 w-12 border-2 border-slate-700">
                    <AvatarFallback className="bg-slate-700 text-slate-400 text-xs font-bold">Vous</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold text-white border border-white/5">
                Vous
              </div>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-11 w-11 rounded-xl transition-all",
                  isMuted ? "bg-rose-500 text-white hover:bg-rose-600" : "text-white hover:bg-white/10"
                )}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-11 w-11 rounded-xl transition-all",
                  isVideoOff ? "bg-rose-500 text-white hover:bg-rose-600" : "text-white hover:bg-white/10"
                )}
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
              <div className="w-[1px] h-6 bg-white/10 mx-2" />
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-white hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-white hover:bg-white/10">
                <Maximize2 className="h-5 w-5" />
              </Button>
              <Button className="h-11 px-6 rounded-xl bg-rose-500 text-white hover:bg-rose-600 font-bold text-xs uppercase tracking-widest ml-4 shadow-lg shadow-rose-500/20">
                <PhoneOff className="mr-2 h-4 w-4" />
                Terminer
              </Button>
            </div>
          </div>

          {/* Right Sidebar: Chat & Info */}
          <div className="w-80 flex flex-col gap-6">
            <Card className="flex-1 border-slate-100 shadow-sm flex flex-col overflow-hidden bg-white">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  Chat
                </h3>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                <div className="bg-slate-50 p-3 rounded-xl rounded-tl-none">
                  <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                    Bonjour Docteur, j'ai une légère douleur à l'œil gauche depuis hier soir.
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 mt-2 block uppercase">Sophie • 14:40</span>
                </div>
              </div>
              <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                <div className="relative">
                  <input 
                    placeholder="Écrire un message..." 
                    className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-4 pr-10 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8 rounded-md text-slate-400 hover:text-slate-900">
                    <Video className="h-3.5 w-3.5 rotate-45" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-slate-100 shadow-sm p-5 bg-white">
              <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Dossier rapide
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-50 text-[10px] font-bold text-slate-500">SB</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[12px] font-bold text-slate-900 leading-none">Sophie Bernard</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">28 ans • Post-Opératoire</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Historique</p>
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                    Chirurgie Laser effectuée le 12/03. Suivi hebdomadaire.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
