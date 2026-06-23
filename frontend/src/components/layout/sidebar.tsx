"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  MessageSquare,
  BarChart3,
  BookOpen,
  UserCircle,
  Cpu,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/lib/constants/app-config";
import { DOCTOR_NAV_ACTIVE, DOCTOR_NAV_IDLE } from "@/components/doctor/doctor-dashboard-shell";

interface SidebarProps {
  role: "medecin" | "secretaire" | "admin" | "stagiaire";
}

type NavItem = { name: string; href: string; icon: LucideIcon; short?: string };
type NavGroup = { label: string; items: NavItem[] };

const medecinNavGroups: NavGroup[] = [
  {
    label: "Quotidien",
    items: [
      { name: "Tableau de bord", href: "/dashboard/medecin", icon: LayoutDashboard, short: "Accueil" },
      { name: "Agenda", href: "/dashboard/medecin/agenda", icon: Calendar },
      { name: "Consultations", href: "/dashboard/medecin/consultations", icon: ClipboardList },
      { name: "Téléconsultation", href: "/dashboard/medecin/teleconsultation", icon: Video },
    ],
  },
  {
    label: "Patients",
    items: [
      { name: "Dossiers patients", href: "/dashboard/medecin/patients", icon: Users },
      { name: "Ordonnances", href: "/dashboard/medecin/ordonnances", icon: FileText },
    ],
  },
  {
    label: "Cabinet",
    items: [
      { name: "Facturation", href: "/dashboard/medecin/gestion", icon: Receipt },
      { name: "Analytiques", href: "/dashboard/medecin/analytics", icon: BarChart3 },
      { name: "Messages", href: "/dashboard/medecin/comm", icon: MessageSquare },
    ],
  },
  {
    label: "Compte",
    items: [
      { name: "Profil public", href: "/dashboard/medecin/profile", icon: UserCircle },
      { name: "Paramètres", href: "/dashboard/medecin/settings/profile", icon: SlidersHorizontal },
      { name: "Assistant IA", href: "/dashboard/medecin/ia", icon: Bot },
      { name: "Équipements", href: "/dashboard/medecin/machines", icon: Cpu },
    ],
  },
];

const navItems = {
  medecin: medecinNavGroups.flatMap((g) => g.items),
  secretaire: [
    { name: "Accueil Cabinet", href: "/dashboard/secretaire", icon: LayoutDashboard },
    { name: "Agenda du Docteur", href: "/dashboard/secretaire/agenda", icon: Calendar },
    { name: "Dossiers Patients", href: "/dashboard/secretaire/patients", icon: Users },
    { name: "Ma Facturation", href: "/dashboard/secretaire/gestion", icon: Receipt },
    { name: "Communication", href: "/dashboard/secretaire/comm", icon: MessageSquare },
    { name: "Téléconsultation", href: "/dashboard/secretaire/teleconsultation", icon: Video },
    { name: "Paramètres", href: "/dashboard/secretaire/settings", icon: Settings },
  ],
  admin: [
    { name: "Vue d'ensemble", href: "/dashboard/admin", icon: ShieldCheck },
    { name: "Médecins", href: "/dashboard/admin/doctors", icon: Users },
    { name: "Spécialités", href: "/dashboard/admin/specialties", icon: FileText },
    { name: "Sécurité & audit", href: "/dashboard/admin/security", icon: ShieldCheck },
    { name: "Modération avis", href: "/dashboard/admin/moderation", icon: MessageSquare },
    { name: "Maintenance", href: "/dashboard/admin/maintenance", icon: Settings },
  ],
  stagiaire: [
    { name: "Assistant IA", href: "/dashboard/stagiaire", icon: Bot },
    { name: "Dossiers patients", href: "/dashboard/stagiaire/patients", icon: Users },
    { name: "Suivi & Quiz", href: "/dashboard/stagiaire/clinique", icon: GraduationCap },
    { name: "Bibliothèque", href: "/dashboard/stagiaire/bibliotheque", icon: BookOpen },
  ],
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/medecin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  isCollapsed,
  isDoctor,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  isDoctor: boolean;
}) {
  const active = isNavActive(pathname, item.href);
  const activeClass = isDoctor ? DOCTOR_NAV_ACTIVE : "bg-slate-900 text-white";
  const idleClass = isDoctor ? DOCTOR_NAV_IDLE : "text-slate-500 hover:bg-slate-50 hover:text-slate-900";

  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 py-2 pl-3 pr-2 text-[13px] transition-colors",
                active ? activeClass : idleClass,
                isCollapsed && "justify-center px-2",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? (isDoctor ? "text-cyan-700" : "text-white") : "text-slate-400",
                )}
                strokeWidth={active ? 2.25 : 2}
              />
              {!isCollapsed && <span className="truncate">{item.short ?? item.name}</span>}
            </Link>
          }
        />
        {isCollapsed ? (
          <TooltipContent side="right" className="rounded-md bg-slate-800 text-xs text-white">
            {item.name}
          </TooltipContent>
        ) : null}
      </Tooltip>
    </TooltipProvider>
  );
}

export function AppSidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const isDoctor = role === "medecin";
  const flatItems = navItems[role];

  return (
    <div
      className={cn(
        "relative z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200",
        isCollapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      <div className="flex h-12 items-center border-b border-slate-100 px-4">
        <Link href={isDoctor ? "/dashboard/medecin" : "/"} className="min-w-0">
          {!isCollapsed ? (
            <span className="text-sm font-semibold text-slate-900">{APP_CONFIG.APP_NAME}</span>
          ) : (
            <span className="mx-auto block text-xs font-bold text-slate-700">OC</span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {isDoctor ? (
          medecinNavGroups.map((group) => (
            <div key={group.label} className="mb-3">
              {!isCollapsed ? (
                <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                    isDoctor
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-0.5 px-1">
            {flatItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                isDoctor={false}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-2">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-9 w-full rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            isCollapsed ? "justify-center px-0" : "justify-start gap-2 px-3",
          )}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="text-sm">Déconnexion</span>}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-14 z-50 h-6 w-6 rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-800"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}
