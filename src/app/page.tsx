"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  ArrowRight, 
  Shield, 
  Activity, 
  Users, 
  Clock, 
  Globe, 
  Zap,
  ChevronRight,
  CheckCircle2,
  Bot
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">OphthoCare</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Solution", "Équipements", "IA Assistant", "Tarifs"].map((item) => (
              <Link key={item} href="#" className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
                {item}
              </Link>
            ))}
            <Link href="/patient" className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest hover:bg-emerald-100 transition-colors">
              Espace Patient
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-[13px] font-bold text-slate-500 hover:text-slate-900" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button className="h-9 px-5 rounded-lg bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 shadow-sm" asChild>
              <Link href="/login">Essayer gratuitement</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <Zap className="h-3 w-3 text-amber-500" />
            La nouvelle ère de l'ophtalmologie
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[1.1]">
            Gérez votre cabinet avec une <br /> <span className="text-slate-400">élégance absolue.</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Une plateforme minimaliste et intelligente intégrant vos équipements, 
            l'IA générative et une gestion fluide du cabinet médical.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button className="h-12 px-8 rounded-xl bg-slate-900 text-white text-[14px] font-bold hover:bg-slate-800 shadow-lg shadow-slate-200" asChild>
              <Link href="/login">
                Démarrer maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" className="h-12 px-8 rounded-xl text-[14px] font-bold text-slate-500 hover:text-slate-900">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-[#FDFDFD] border-y border-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Collaboration Live",
                desc: "Indicateurs de présence et synchronisation en temps réel sur les dossiers patients.",
                icon: Users
              },
              {
                title: "IA & Voix",
                desc: "Dictée vocale médicale et assistant intelligent pour l'aide au diagnostic rapide.",
                icon: Bot
              },
              {
                title: "Design 2026",
                desc: "Une interface minimaliste, mode sombre complet et navigation par raccourcis (Cmd+K).",
                icon: Zap
              }
            ].map((f, i) => (
              <div key={i} className="space-y-4">
                <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                  <f.icon className="h-5 w-5 text-slate-900" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Conçu pour le futur de la <br /> pratique médicale.
            </h2>
            <div className="space-y-4">
              {[
                "Sécurité des données de santé (HDS)",
                "Interface optimisée pour la lecture rapide",
                "Téléconsultation HD intégrée",
                "Tableaux de bord analytiques pro"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-slate-900" />
                  <span className="text-[14px] font-medium text-slate-600">{item}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 text-[13px] font-bold text-slate-900">
              En savoir plus sur la sécurité
            </Button>
          </div>
          <div className="relative">
            <div className="aspect-video bg-slate-50 rounded-[32px] border border-slate-100 shadow-2xl flex items-center justify-center">
              <div className="p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-white rounded-2xl border border-slate-100 mx-auto flex items-center justify-center shadow-sm">
                  <Shield className="h-8 w-8 text-slate-900" />
                </div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Aperçu du Dashboard 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">OphthoCare</span>
            </div>
            <p className="text-[13px] text-slate-400 font-medium">
              © 2026 OphthoCare Medical Suite. <br />
              Tous droits réservés.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Produit</h4>
              <div className="flex flex-col gap-2">
                {["Fonctionnalités", "Sécurité", "IA Assistant"].map(l => (
                  <Link key={l} href="#" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">{l}</Link>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Entreprise</h4>
              <div className="flex flex-col gap-2">
                {["À propos", "Contact", "Blog"].map(l => (
                  <Link key={l} href="#" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">{l}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
