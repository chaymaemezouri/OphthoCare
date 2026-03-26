"use client"

import * as React from "react"
import { 
  Search, 
  User, 
  Users,
  Calendar, 
  ClipboardList, 
  FileText, 
  Video, 
  BarChart3,
  Bot,
  Command as CommandIcon,
  X,
  Settings,
  ShieldCheck,
  GraduationCap,
  BookOpen
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function CommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (!isOpen) return null

  const items = [
    // Médecin
    { name: "Mon Cabinet (Dr)", href: "/dashboard/medecin", icon: Bot },
    { name: "Mon Agenda", href: "/dashboard/medecin/agenda", icon: Calendar },
    { name: "Mes Patients", href: "/dashboard/medecin/patients", icon: Users },
    { name: "Consultations", href: "/dashboard/medecin/consultations", icon: ClipboardList },
    { name: "Équipements", href: "/dashboard/medecin/machines", icon: Settings },
    
    // Secrétaire
    { name: "Accueil Cabinet (Sec)", href: "/dashboard/secretaire", icon: Bot },
    { name: "Agenda du Docteur", href: "/dashboard/secretaire/agenda", icon: Calendar },
    { name: "Ma Facturation", href: "/dashboard/secretaire/gestion", icon: FileText },
    
    // Admin
    { name: "Console Système", href: "/dashboard/admin", icon: ShieldCheck },
    { name: "Maintenance & Système", href: "/dashboard/admin/maintenance", icon: Settings },
    
    // Stagiaire
    { name: "Suivi Clinique (Stagiaire)", href: "/dashboard/stagiaire/clinique", icon: GraduationCap },
    { name: "Bibliothèque", href: "/dashboard/stagiaire/bibliotheque", icon: BookOpen },
    
    { name: "Espace Patient (Démo)", href: "/patient", icon: User },
  ].filter(item => item.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={() => setIsOpen(false)} 
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 h-14 border-b border-slate-50 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400 mr-3" />
          <input
            autoFocus
            placeholder="Rechercher une page, un patient..."
            className="flex-1 bg-transparent border-none outline-none text-[14px] font-medium text-slate-900 dark:text-slate-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400">ESC</kbd>
          </div>
        </div>
        
        <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {items.length > 0 ? (
            <div className="space-y-1">
              <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation rapide</p>
              {items.map((item) => (
                <button
                  key={item.name}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                  onClick={() => {
                    router.push(item.href)
                    setIsOpen(false)
                  }}
                >
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                    <item.icon className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{item.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-[13px] font-medium text-slate-400">Aucun résultat trouvé pour "{search}"</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">↑↓</kbd>
              <span>Naviguer</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">ENTER</kbd>
              <span>Ouvrir</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <CommandIcon className="h-3 w-3" />
            <span>OphthoCare Command</span>
          </div>
        </div>
      </div>
    </div>
  )
}
