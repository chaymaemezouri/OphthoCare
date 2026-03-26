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
  BookOpen, 
  Search, 
  Download, 
  ExternalLink, 
  FileText, 
  Bookmark,
  ChevronRight,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const resources = [
  { 
    id: "1", 
    title: "Atlas d'Ophtalmologie Clinique", 
    author: "Dr. J. Smith", 
    type: "PDF", 
    category: "Général",
    date: "2025" 
  },
  { 
    id: "2", 
    title: "Interprétation avancée de l'OCT", 
    author: "Collège des Ophtalmologistes", 
    type: "Guide", 
    category: "Imagerie",
    date: "2026" 
  },
  { 
    id: "3", 
    title: "Pathologies de la Rétine", 
    author: "Société Française d'Ophtalmologie", 
    type: "Cours", 
    category: "Rétine",
    date: "2024" 
  },
  { 
    id: "4", 
    title: "Protocoles Post-Opératoires", 
    author: "Cabinet OphthoCare", 
    type: "Interne", 
    category: "Protocoles",
    date: "2026" 
  },
];

export default function StagiaireBibliothequePage() {
  return (
    <DashboardLayout role="stagiaire">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bibliothèque Médicale</h2>
            <p className="text-[13px] text-slate-500 font-medium">Ressources, guides et documentation scientifique</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
              <Bookmark className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Mes Favoris
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Rechercher une ressource..." 
              className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-[13px] focus-visible:ring-1 focus-visible:ring-slate-200 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="h-9 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Filtrer par catégorie
            </Button>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {resources.map((res) => (
            <Card key={res.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all duration-300">
                    <FileText className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <Badge className="bg-slate-50 text-slate-400 border-none text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                    {res.type}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{res.title}</h3>
                  <p className="text-[12px] text-slate-500 font-medium">{res.author}</p>
                </div>

                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Catégorie</span>
                    <span className="text-[11px] font-bold text-slate-900">{res.category}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Édition</span>
                    <span className="text-[11px] font-bold text-slate-900">{res.date}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-500">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cabinet Internal Documentation Section */}
        <div className="pt-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-900">Documentation Cabinet</h3>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                <BookOpen className="h-7 w-7 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[16px] font-bold text-slate-900 italic">Manuel de l'interne OphthoCare</h4>
                <p className="text-[13px] text-slate-500 font-medium">Guide complet sur les procédures, l'utilisation des machines et l'éthique du cabinet.</p>
              </div>
            </div>
            <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 transition-all shadow-lg">
              Consulter le manuel
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
