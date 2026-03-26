"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard, 
  Mail, 
  Smartphone,
  ChevronRight,
  Plus,
  Save,
  Trash2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  return (
    <DashboardLayout role="medecin">
      <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Paramètres du Cabinet</h2>
            <p className="text-[13px] text-slate-500 font-medium">Configurez votre environnement de travail et vos préférences.</p>
          </div>
          <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 transition-all shadow-sm">
            <Save className="mr-2 h-3.5 w-3.5" />
            Enregistrer les modifications
          </Button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Nav */}
          <div className="space-y-1">
            {[
              { name: "Profil & Utilisateur", icon: User, active: true },
              { name: "Cabinet & Lieux", icon: Building2 },
              { name: "Notifications", icon: Bell },
              { name: "Sécurité & Accès", icon: Shield },
              { name: "Facturation & Plans", icon: CreditCard },
              { name: "Intégrations Web", icon: Globe },
            ].map((item) => (
              <button
                key={item.name}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left",
                  item.active 
                    ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <item.icon className={cn("h-4 w-4", item.active ? "text-slate-900" : "text-slate-300")} />
                {item.name}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-8">
            {/* Profile Section */}
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  Informations du Praticien
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-8">
                  <div className="h-20 w-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 group cursor-pointer hover:border-slate-400 transition-all">
                    <User className="h-8 w-8 opacity-20 group-hover:opacity-40" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="h-8 px-4 rounded-lg text-[11px] font-bold uppercase tracking-widest border-slate-200">Changer la photo</Button>
                    <p className="text-[11px] text-slate-400 font-medium">Format JPG, PNG ou GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nom complet</label>
                    <Input defaultValue="Dr. Thomas Martin" className="h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Spécialité</label>
                    <Input defaultValue="Chirurgien Ophtalmologiste" className="h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email professionnel</label>
                    <Input defaultValue="t.martin@ophthocare.fr" className="h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Numéro RPPS</label>
                    <Input defaultValue="1234567890" className="h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[13px]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cabinet Settings */}
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  Configuration du Cabinet
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  {[
                    { name: "OphthoCare Centre-Ville", address: "12 rue de la Paix, 75002 Paris", type: "Principal" },
                    { name: "OphthoCare Clinique Est", address: "45 avenue des Arts, 75011 Paris", type: "Secondaire" },
                  ].map((cabinet, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[13px] font-bold text-slate-900">{cabinet.name}</h4>
                            <Badge className="bg-white text-slate-400 border border-slate-100 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest">{cabinet.type}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">{cabinet.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><Settings className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full h-12 border-2 border-dashed border-slate-100 rounded-2xl text-[12px] font-bold text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un nouveau lieu d'exercice
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-bold text-slate-900">Préférences de Communication</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  {[
                    { name: "Rappels de RDV Automatiques (SMS)", desc: "Envoi un rappel 24h avant le rendez-vous.", enabled: true },
                    { name: "Notifications d'urgence", desc: "Alerte instantanée sur mobile en cas de message urgent.", enabled: true },
                    { name: "Rapports hebdomadaires", desc: "Synthèse de l'activité du cabinet par email.", enabled: false },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-slate-900">{pref.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{pref.desc}</p>
                      </div>
                      <div className={cn(
                        "h-5 w-10 rounded-full relative cursor-pointer transition-colors",
                        pref.enabled ? "bg-emerald-500" : "bg-slate-200"
                      )}>
                        <div className={cn(
                          "absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
                          pref.enabled ? "right-1" : "left-1"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Design & Branding - IMPROVEMENT */}
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-bold text-slate-900">Design & Branding 2026</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Couleur d'accentuation</p>
                    <div className="flex gap-3">
                      {[
                        { name: "Émeraude (Défaut)", color: "bg-emerald-500", active: true },
                        { name: "Bleu Médical", color: "bg-blue-500" },
                        { name: "Indigo Pro", color: "bg-indigo-500" },
                        { name: "Ardoise", color: "bg-slate-700" },
                      ].map((c) => (
                        <div key={c.name} className={cn(
                          "h-10 w-10 rounded-xl cursor-pointer border-2 transition-all hover:scale-110",
                          c.color,
                          c.active ? "border-slate-900 shadow-lg" : "border-transparent"
                        )} title={c.name} />
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-bold text-slate-900">Mode Ultra-Minimaliste</p>
                      <p className="text-[11px] text-slate-500 font-medium">Réduit encore plus les bordures et les espacements.</p>
                    </div>
                    <div className="h-5 w-10 rounded-full bg-slate-200 relative cursor-pointer">
                      <div className="absolute top-1 left-1 h-3 w-3 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
