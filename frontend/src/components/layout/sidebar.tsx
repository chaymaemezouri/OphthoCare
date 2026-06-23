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
  Menu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/lib/constants/app-config";
import { DOCTOR_NAV_ACTIVE, DOCTOR_NAV_IDLE } from "@/components/doctor/doctor-dashboard-shell";

export type DashboardRole = "medecin" | "secretaire" | "admin" | "stagiaire";

interface SidebarProps {
  role: DashboardRole;
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

export const navItems: Record<DashboardRole, NavItem[]> = {
  medecin: medecinNavGroups.flatMap((g) => g.items),
  secretaire: [
    { name: "Accueil Cabinet", href: "/dashboard/secretaire", icon: LayoutDashboard, short: "Accueil" },
    { name: "Agenda du Docteur", href: "/dashboard/secretaire/agenda", icon: Calendar, short: "Agenda" },
    { name: "Dossiers Patients", href: "/dashboard/secretaire/patients", icon: Users, short: "Patients" },
    { name: "Ma Facturation", href: "/dashboard/secretaire/gestion", icon: Receipt, short: "Factures" },
    { name: "Communication", href: "/dashboard/secretaire/comm", icon: MessageSquare, short: "Messages" },
    { name: "Téléconsultation", href: "/dashboard/secretaire/teleconsultation", icon: Video, short: "Télé" },
    { name: "Paramètres", href: "/dashboard/secretaire/settings", icon: Settings, short: "Réglages" },
  ],
  admin: [
    { name: "Vue d'ensemble", href: "/dashboard/admin", icon: ShieldCheck, short: "Accueil" },
    { name: "Médecins", href: "/dashboard/admin/doctors", icon: Users, short: "Médecins" },
    { name: "Spécialités", href: "/dashboard/admin/specialties", icon: FileText, short: "Spé." },
    { name: "Sécurité & audit", href: "/dashboard/admin/security", icon: ShieldCheck, short: "Sécurité" },
    { name: "Modération avis", href: "/dashboard/admin/moderation", icon: MessageSquare, short: "Avis" },
    { name: "Maintenance", href: "/dashboard/admin/maintenance", icon: Settings, short: "Maint." },
  ],
  stagiaire: [
    { name: "Assistant IA", href: "/dashboard/stagiaire", icon: Bot, short: "IA" },
    { name: "Dossiers patients", href: "/dashboard/stagiaire/patients", icon: Users, short: "Patients" },
    { name: "Suivi & Quiz", href: "/dashboard/stagiaire/clinique", icon: GraduationCap, short: "Quiz" },
    { name: "Bibliothèque", href: "/dashboard/stagiaire/bibliotheque", icon: BookOpen, short: "Docs" },
  ],
};

/** Barre du bas mobile — 4 raccourcis + « Menu » */
export const mobileBottomNavByRole: Record<DashboardRole, NavItem[]> = {
  medecin: [
    { name: "Accueil", href: "/dashboard/medecin", icon: LayoutDashboard, short: "Accueil" },
    { name: "Agenda", href: "/dashboard/medecin/agenda", icon: Calendar, short: "Agenda" },
    { name: "Consultations", href: "/dashboard/medecin/consultations", icon: ClipboardList, short: "File" },
    { name: "Patients", href: "/dashboard/medecin/patients", icon: Users, short: "Patients" },
  ],
  secretaire: [
    { name: "Accueil", href: "/dashboard/secretaire", icon: LayoutDashboard, short: "Accueil" },
    { name: "Agenda", href: "/dashboard/secretaire/agenda", icon: Calendar, short: "Agenda" },
    { name: "Patients", href: "/dashboard/secretaire/patients", icon: Users, short: "Patients" },
    { name: "Messages", href: "/dashboard/secretaire/comm", icon: MessageSquare, short: "Messages" },
  ],
  admin: [
    { name: "Accueil", href: "/dashboard/admin", icon: ShieldCheck, short: "Accueil" },
    { name: "Médecins", href: "/dashboard/admin/doctors", icon: Users, short: "Médecins" },
    { name: "Avis", href: "/dashboard/admin/moderation", icon: MessageSquare, short: "Avis" },
    { name: "Sécurité", href: "/dashboard/admin/security", icon: ShieldCheck, short: "Sécurité" },
  ],
  stagiaire: [
    { name: "IA", href: "/dashboard/stagiaire", icon: Bot, short: "IA" },
    { name: "Patients", href: "/dashboard/stagiaire/patients", icon: Users, short: "Patients" },
    { name: "Quiz", href: "/dashboard/stagiaire/clinique", icon: GraduationCap, short: "Quiz" },
    { name: "Bibliothèque", href: "/dashboard/stagiaire/bibliotheque", icon: BookOpen, short: "Docs" },
  ],
};

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/medecin") return pathname === href;
  if (href === "/dashboard/secretaire") return pathname === href;
  if (href === "/dashboard/admin") return pathname === href;
  if (href === "/dashboard/stagiaire") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  isCollapsed,
  isDoctor,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  isDoctor: boolean;
  onNavigate?: () => void;
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
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 py-2.5 pl-3 pr-2 text-[13px] transition-colors",
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

export function SidebarNavContent({
  role,
  isCollapsed = false,
  onNavigate,
  showLogout = true,
  className,
}: {
  role: DashboardRole;
  isCollapsed?: boolean;
  onNavigate?: () => void;
  showLogout?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isDoctor = role === "medecin";
  const flatItems = navItems[role];

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-12 shrink-0 items-center border-b border-slate-100 px-4">
        <Link href={isDoctor ? "/dashboard/medecin" : flatItems[0]?.href ?? "/"} className="min-w-0" onClick={onNavigate}>
          {!isCollapsed ? (
            <span className="text-sm font-semibold text-slate-900">{APP_CONFIG.APP_NAME}</span>
          ) : (
            <span className="mx-auto block text-xs font-bold text-slate-700">OC</span>
          )}
        </Link>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto py-2">
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
                    onNavigate={onNavigate}
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
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {showLogout ? (
        <div className="shrink-0 border-t border-slate-100 p-2">
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
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div
      className={cn(
        "relative z-50 hidden h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200 md:flex",
        isCollapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      <SidebarNavContent role={role} isCollapsed={isCollapsed} />

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-14 z-50 hidden h-6 w-6 rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-800 md:inline-flex"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Déplier le menu" : "Replier le menu"}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </div>
  );
}

export function DashboardMobileBottomNav({
  role,
  onOpenMenu,
}: {
  role: DashboardRole;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const isDoctor = role === "medecin";
  const items = mobileBottomNavByRole[role];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex border-t bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.06)] md:hidden",
        isDoctor ? "border-slate-200" : "border-slate-200",
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-16 w-full items-stretch">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
              active
                ? isDoctor
                  ? "text-cyan-700"
                  : "text-slate-900"
                : "text-slate-500",
            )}
          >
            <item.icon
              className={cn("h-5 w-5", active && (isDoctor ? "text-cyan-600" : "text-slate-900"))}
              strokeWidth={active ? 2.25 : 2}
            />
            <span className="max-w-full truncate">{item.short ?? item.name}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-slate-500"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        <span>Menu</span>
      </button>
      </div>
    </nav>
  );
}
