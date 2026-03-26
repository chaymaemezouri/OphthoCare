"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Eye, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ClipboardList, 
  FileText, 
  Receipt, 
  Bot, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Video,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface SidebarProps {
  role: "medecin" | "secretaire" | "admin" | "stagiaire";
}

const navItems = {
  medecin: [
    { name: "Mon Cabinet", href: "/dashboard/medecin", icon: LayoutDashboard },
    { name: "Mon Agenda", href: "/dashboard/medecin/agenda", icon: Calendar },
    { name: "Mes Patients", href: "/dashboard/medecin/patients", icon: Users },
    { name: "Consultations", href: "/dashboard/medecin/consultations", icon: ClipboardList },
    { name: "Ordonnances", href: "/dashboard/medecin/ordonnances", icon: FileText },
    { name: "Téléconsultation", href: "/dashboard/medecin/teleconsultation", icon: Video },
    { name: "Analytiques", href: "/dashboard/medecin/analytics", icon: BarChart3 },
    { name: "Assistant IA", href: "/dashboard/medecin/ia", icon: Bot },
    { name: "Équipements", href: "/dashboard/medecin/machines", icon: Settings },
    { name: "Ma Gestion", href: "/dashboard/medecin/gestion", icon: Receipt },
    { name: "Paramètres", href: "/dashboard/medecin/settings", icon: Settings },
  ],
  secretaire: [
    { name: "Accueil Cabinet", href: "/dashboard/secretaire", icon: LayoutDashboard },
    { name: "Agenda du Docteur", href: "/dashboard/secretaire/agenda", icon: Calendar },
    { name: "Dossiers Patients", href: "/dashboard/secretaire/patients", icon: Users },
    { name: "Ma Facturation", href: "/dashboard/secretaire/gestion", icon: Receipt },
    { name: "Communication", href: "/dashboard/secretaire/comm", icon: Video },
    { name: "Paramètres", href: "/dashboard/secretaire/settings", icon: Settings },
  ],
  admin: [
    { name: "Console Système", href: "/dashboard/admin", icon: ShieldCheck },
    { name: "Mon Compte", href: "/dashboard/admin", icon: Users },
    { name: "Logs & Sécurité", href: "/dashboard/admin", icon: FileText },
    { name: "Maintenance", href: "/dashboard/admin/maintenance", icon: Settings },
  ],
  stagiaire: [
    { name: "Assistant IA", href: "/dashboard/stagiaire", icon: Bot },
    { name: "Suivi Clinique", href: "/dashboard/stagiaire/clinique", icon: GraduationCap },
    { name: "Bibliothèque", href: "/dashboard/stagiaire/bibliotheque", icon: BookOpen },
  ],
};

export function AppSidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const items = navItems[role];

  return (
    <div 
      className={cn(
        "relative flex flex-col h-screen bg-white border-r border-slate-100 transition-all duration-300 ease-in-out z-50",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Brand Logo */}
      <div className="flex items-center h-16 px-5">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <Eye className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-slate-900 text-sm tracking-tight">OphthoCare</span>
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <TooltipProvider key={item.name} delay={0}>
              <Tooltip>
                <TooltipTrigger render={
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-slate-900 text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                    )} />
                    {!isCollapsed && (
                      <span className="text-[13px] font-medium tracking-tight">{item.name}</span>
                    )}
                  </Link>
                } />
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-slate-900 text-white text-[11px] font-bold rounded-md">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-100">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full h-10 rounded-lg gap-3 transition-all",
            isCollapsed ? "justify-center" : "justify-start px-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          )}
          asChild
        >
          <Link href="/login">
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="text-[13px] font-medium tracking-tight">Déconnexion</span>}
          </Link>
        </Button>
        
        {/* Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm hover:text-slate-900 transition-all z-50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}
