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
  Smartphone,
  Save,
  Trash2,
  Plus
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function SecretaireSettingsPage() {
  return (
    <DashboardLayout role="secretaire">
      <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Paramètres du Secrétariat</h2>
            <p className="text-[13px] text-slate-500 font-medium">Gérez vos préférences d'accueil et la configuration du cabinet.</p>
          </div>
          <Button className="h-9 px-4 rounded-lg bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600 transition-all shadow-sm border-none">
            <Save className="mr-2 h-3.5 w-3.5" />
            Enregistrer les modifications
          </Button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Nav */}
          <div className="space-y-1">
            {[
              { name: "Mon Profil", icon: User, active: true },
              { name: "Gestion du Cabinet", icon: Building2 },
              { name: "Notifications SMS/RDV", icon: Bell },
              { name: "Sécurité & Accès", icon: Shield },
              { name: "Facturation & Tarifs", icon: CreditCard },
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
                  Informations Secrétaire
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nom complet</label>
                    <Input defaultValue="Mme. Leroy" className="h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Poste</label>
                    <Input defaultValue="Secrétaire Médicale" className="h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email professionnel</label>
                    <Input defaultValue="secretariat@ophthocare.fr" className="h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[13px]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cabinet Settings */}
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  Configuration de l'Accueil
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  {[
                    { name: "OphthoCare Centre-Ville", address: "12 rue de la Paix, 75002 Paris", type: "Principal" },
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50">
                <CardTitle className="text-[14px] font-bold text-slate-900">Rappels de RDV Automatiques (SMS)</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  {[
                    { name: "Rappels SMS (J-1)", desc: "Envoi automatique 24h avant le rendez-vous.", enabled: true },
                    { name: "Confirmation immédiate", desc: "SMS envoyé dès la prise de rendez-vous.", enabled: true },
                    { name: "Annulation / Report", desc: "Notification automatique en cas de modification.", enabled: true },
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
