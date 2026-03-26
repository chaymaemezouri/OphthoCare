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
  MessageSquare, 
  Phone, 
  Video, 
  Search,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const chats = [
  { id: "1", name: "Marie Laurent", lastMsg: "Merci pour le rappel de RDV", time: "14:20", unread: 2 },
  { id: "2", name: "Robert Leroy", lastMsg: "J'ai bien reçu la facture", time: "11:05", unread: 0 },
  { id: "3", name: "Dr. Martin", lastMsg: "Préparer le dossier de M. Petit", time: "09:45", unread: 1 },
];

export default function SecretaireCommPage() {
  return (
    <DashboardLayout role="secretaire">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Communication</h2>
            <p className="text-[13px] text-slate-500 font-medium">Échanges avec les patients et le docteur</p>
          </div>
          <Button className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all shadow-sm border-none">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouveau Message
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Chat List */}
          <Card className="border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="p-4 border-b border-slate-50 space-y-4">
              <CardTitle className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Messages</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-9 h-9 bg-slate-50 border-none rounded-lg text-[12px]"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <div className="divide-y divide-slate-50">
                {chats.map((chat) => (
                  <div key={chat.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors relative group">
                    <Avatar className="h-10 w-10 border border-slate-100">
                      <AvatarFallback className="bg-slate-50 text-slate-400 text-[10px] font-bold">
                        {chat.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-bold text-slate-900 truncate">{chat.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{chat.lastMsg}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="absolute right-4 bottom-4 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">{chat.unread}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Window (Placeholder) */}
          <Card className="border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col h-[600px] relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <MessageSquare className="h-8 w-8 text-slate-200" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[15px] font-bold text-slate-900 italic">Sélectionnez une conversation</h3>
                <p className="text-[12px] text-slate-400 font-medium max-w-[240px]">
                  Consultez vos échanges sécurisés avec les patients ou le Dr. Martin.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
