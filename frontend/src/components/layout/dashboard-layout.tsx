"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppSidebar } from "./sidebar";
import {
  Bell,
  Calendar,
  ClipboardList,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessagingUnreadBadge } from "@/components/common/MessagingUnreadBadge";
import { CommandPalette } from "@/components/command-palette";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";
import { DOCTOR_ACCENT_BTN, DOCTOR_OUTLINE_BTN } from "@/components/doctor/doctor-dashboard-shell";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "medecin" | "secretaire" | "admin" | "stagiaire";
}

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const a = (first?.[0] || "").toUpperCase();
  const b = (last?.[0] || "").toUpperCase();
  if (a && b) return `${a}${b}`;
  if (a) return a;
  if (email?.[0]) return email[0].toUpperCase();
  return "?";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { user } = useAuth();
  const isDoctorSpace = role === "medecin";
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    (isDoctorSpace ? "Praticien" : "Utilisateur");

  const accountHref =
    role === "medecin"
      ? "/dashboard/medecin/settings/profile"
      : role === "secretaire"
        ? "/dashboard/secretaire/settings"
        : "/account";

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden font-sans antialiased",
        isDoctorSpace ? "bg-slate-100 text-slate-900" : "bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100",
      )}
    >
      <CommandPalette />
      <AppSidebar role={role} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            "shrink-0 border-b bg-white",
            isDoctorSpace ? "border-slate-200" : "border-slate-100",
          )}
        >
          {isDoctorSpace ? (
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2 sm:px-6 lg:px-8">
              <p className="truncate text-xs capitalize text-slate-500">{todayLabel}</p>
              <div className="hidden items-center gap-1.5 md:flex">
                <Button variant="outline" size="sm" className={cn("h-8 text-xs", DOCTOR_OUTLINE_BTN)} asChild>
                  <Link href="/dashboard/medecin/agenda">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Agenda
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs", DOCTOR_OUTLINE_BTN)} asChild>
                  <Link href="/dashboard/medecin/consultations">
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                    File du jour
                  </Link>
                </Button>
                <Button size="sm" className={cn("h-8 text-xs", DOCTOR_ACCENT_BTN)} asChild>
                  <Link href="/dashboard/medecin/patients">
                    <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                    Dossiers patients
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex h-12 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="relative min-w-0 flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={isDoctorSpace ? "Patient, rendez-vous… (Ctrl+K)" : "Rechercher…"}
                className="h-9 w-full rounded-md border-slate-200 bg-slate-50 pl-9 text-sm"
              />
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {role === "medecin" || role === "secretaire" ? (
                <MessagingUnreadBadge
                  href={`/dashboard/${role === "medecin" ? "medecin" : "secretaire"}/comm`}
                />
              ) : null}

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-slate-500 hover:text-slate-900"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" className="h-9 gap-2 rounded-md px-2 hover:bg-slate-50">
                      <Avatar className="h-7 w-7 rounded-md border border-slate-200">
                        <AvatarFallback
                          className={cn(
                            "rounded-md text-[10px] font-semibold text-white",
                            isDoctorSpace ? "bg-slate-700" : "bg-slate-900",
                          )}
                        >
                          {initials(user?.firstName, user?.lastName, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[9rem] truncate text-sm font-medium text-slate-800 md:inline">
                        {isDoctorSpace && user?.lastName ? `Dr. ${user.lastName}` : displayName}
                      </span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-52 rounded-lg border-slate-200 p-1">
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs text-slate-500">Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer rounded-md py-2 text-sm">
                    <Link href={accountHref} className="flex w-full items-center gap-2">
                      <Settings className="h-4 w-4 text-slate-400" />
                      Paramètres cabinet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-md py-2 text-sm">
                    <Link href="/account" className="flex w-full items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      Sécurité
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-md py-2 text-sm text-rose-600"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div
          className={cn(
            "custom-scrollbar flex-1 overflow-y-auto",
            isDoctorSpace ? "bg-slate-100" : "bg-[#FDFDFD] p-8 lg:p-10",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
