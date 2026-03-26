"use client"

import * as React from "react"
import { 
  Maximize2, 
  Layers, 
  Activity, 
  BrainCircuit, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Search,
  Crosshair,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AIImagingViewerProps {
  title: string;
  date: string;
  onClose?: () => void;
}

export function AIImagingViewer({ title, date, onClose }: AIImagingViewerProps) {
  const [activeLayer, setActiveLayer] = React.useState<"raw" | "ai" | "vessels">("ai")
  const [zoom, setZoom] = React.useState(1)
  const [showAnalysis, setShowAnalysis] = React.useState(true)

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-[14px] font-bold text-white tracking-tight">{title} - Analyse IA</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: ML-2026-001 • {date}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <Button 
              variant="ghost" 
              className={cn(
                "h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all",
                activeLayer === "raw" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
              onClick={() => setActiveLayer("raw")}
            >
              Brut
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all",
                activeLayer === "ai" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
              onClick={() => setActiveLayer("ai")}
            >
              IA (Diagnostic)
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "h-8 px-4 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all",
                activeLayer === "vessels" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
              onClick={() => setActiveLayer("vessels")}
            >
              Vaisseaux
            </Button>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-16 border-r border-white/10 flex flex-col items-center py-6 gap-6 bg-slate-900/50">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <BrainCircuit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all">
            <Crosshair className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all">
            <Layers className="h-5 w-5" />
          </Button>
          <div className="mt-auto">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-500 hover:text-white">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Viewer */}
        <div className="flex-1 relative flex items-center justify-center p-12 overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900">
          <div className="relative aspect-square w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 animate-in zoom-in-95 duration-500">
            {/* Simulated Imaging - Base */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579154235602-3c35bd79939e?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-screen" />
            
            {/* AI Heatmap Overlay */}
            {activeLayer === "ai" && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_55%,_rgba(255,0,0,0.3)_0%,_transparent_40%),radial-gradient(circle_at_65%_45%,_rgba(255,200,0,0.2)_0%,_transparent_30%)] animate-pulse mix-blend-overlay" />
            )}
            
            {/* AI Annotations */}
            {activeLayer === "ai" && (
              <>
                <div className="absolute top-[45%] left-[45%] h-24 w-24 border-2 border-dashed border-rose-500 rounded-full animate-in zoom-in duration-300">
                  <div className="absolute -top-8 -left-4 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    DRUZE SUSPECTÉ (94%)
                  </div>
                </div>
                <div className="absolute top-[40%] right-[30%] h-16 w-16 border-2 border-dashed border-amber-500 rounded-full animate-in zoom-in duration-500 delay-200">
                  <div className="absolute -top-8 -right-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="h-3 w-3" />
                    ZONE À SURVEILLER
                  </div>
                </div>
              </>
            )}

            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          {/* Floating Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zoom</span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-white/5 text-white" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>-</Button>
                <span className="text-[12px] font-bold text-white w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-white/5 text-white" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</Button>
              </div>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opacité IA</span>
              <div className="h-1.5 w-32 bg-white/5 rounded-full relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-emerald-500 w-3/4 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Analysis Report */}
        {showAnalysis && (
          <div className="w-80 border-l border-white/10 flex flex-col bg-slate-900/50 animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-[12px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Rapport d'Analyse IA
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <p className="text-[13px] font-medium text-slate-300 leading-relaxed">
                  L'analyse par réseaux de neurones profonds suggère une progression de la DMLA sèche (stade intermédiaire).
                </p>
                <div className="grid gap-3">
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Score de risque</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-rose-500">84%</span>
                      <span className="text-[10px] font-bold text-rose-400/60 uppercase tracking-widest">Élevé</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Stabilité (OD)</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-emerald-500">92%</span>
                      <span className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">Normal</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Détections Clés</h4>
                <div className="space-y-2">
                  {[
                    { name: "Druses Maculaires", value: "Présence élevée", level: "critical" },
                    { name: "Épaisseur Rétinienne", value: "242µm (Stable)", level: "normal" },
                    { name: "Vascularisation", value: "Aucune néo-vaisseaux", level: "normal" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white">{item.name}</span>
                        <span className="text-[10px] font-medium text-slate-500">{item.value}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/10">
                <p className="text-[12px] font-bold leading-relaxed">Recommandation IA : Renouveler l'examen dans 3 mois et corréler avec le champ visuel.</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-slate-900/50">
              <Button className="w-full bg-white text-slate-900 h-10 rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg">
                Générer le rapport PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
