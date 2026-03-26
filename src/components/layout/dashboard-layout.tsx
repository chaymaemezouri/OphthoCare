"use client";

import { AppSidebar } from "./sidebar";
import { Bell, Search, User, Settings, LogOut, Keyboard, Info, MessageSquare, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/command-palette";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "medecin" | "secretaire" | "admin" | "stagiaire";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans antialiased text-slate-900 dark:text-slate-100">
      <CommandPalette />
      <AppSidebar role={role} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Minimalist Header */}
        <header className="h-16 border-b border-slate-100 flex items-center px-8 shrink-0 justify-between bg-white">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9 h-9 bg-slate-50 border-none rounded-lg w-full text-[13px] focus-visible:ring-1 focus-visible:ring-slate-200 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center -space-x-2 mr-4 border-r border-slate-100 pr-6 py-1">
              <TooltipProvider delay={0}>
                {[
                  { 
                    name: role === "medecin" ? "Dr. Martin (Moi)" : "Dr. Martin", 
                    initial: "DM", 
                    color: "bg-emerald-500",
                    status: "en ligne"
                  },
                  { 
                    name: role === "secretaire" ? "Mme. Leroy (Moi)" : "Mme. Leroy", 
                    initial: "ML", 
                    color: "bg-blue-500",
                    status: "en ligne"
                  },
                ].map((user) => (
                  <Tooltip key={user.name}>
                    <TooltipTrigger render={
                      <div className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 flex items-center justify-center cursor-pointer relative group">
                        <span className="text-[8px] font-black text-slate-600">{user.initial}</span>
                        <div className={cn("absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white dark:border-slate-900", user.color)} />
                      </div>
                    } />
                    <TooltipContent side="bottom" className="text-[10px] font-bold">
                      {user.name} est {user.status}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>

            <Dialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={
                    <DialogTrigger render={
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900">
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    } />
                  } />
                  <TooltipContent side="bottom" className="text-[10px] font-bold">Raccourcis clavier</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent className="max-w-md bg-white border-slate-100 rounded-2xl p-8">
                <DialogHeader>
                  <DialogTitle className="text-[16px] font-bold text-slate-900 flex items-center gap-3">
                    <Keyboard className="h-5 w-5" />
                    Raccourcis Clavier
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-6">
                  {[
                    { key: "Cmd + K", desc: "Ouvrir la palette de commande" },
                    { key: "Cmd + S", desc: "Enregistrer le dossier en cours" },
                    { key: "Cmd + P", desc: "Imprimer l'ordonnance" },
                    { key: "Alt + A", desc: "Accéder à l'agenda" },
                    { key: "Esc", desc: "Fermer la fenêtre active" },
                  ].map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[13px] font-medium text-slate-600">{shortcut.desc}</span>
                      <kbd className="px-2 py-1 rounded bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-900 shadow-sm">{shortcut.key}</kbd>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <ThemeToggle />
            
            {/* Advanced Activity Feed Popover - IMPROVEMENT */}
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={
                    <PopoverTrigger render={
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 transition-all relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-rose-500 rounded-full border-2 border-white" />
                      </Button>
                    } />
                  } />
                  <TooltipContent side="bottom" className="text-[10px] font-bold">Notifications & Activité</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent align="end" className="w-80 p-0 bg-white border-slate-100 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Activité en direct</h3>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-tighter">3 nouvelles</Badge>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                  {[
                    { user: "Dr. Martin", action: "a signé l'ordonnance de", target: "Marie Laurent", time: "2m", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
                    { user: "Secrétariat", action: "a validé le paiement de", target: "Jean Martin", time: "15m", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { user: "Système", action: "Rappel automatique envoyé à", target: "Robert Leroy", time: "1h", icon: MessageSquare, color: "text-orange-500", bg: "bg-orange-50" },
                  ].map((activity, i) => (
                    <div key={i} className="p-4 flex gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <div className={cn("h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border border-transparent group-hover:border-slate-100 transition-all", activity.bg)}>
                        <activity.icon className={cn("h-4 w-4", activity.color)} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[12px] leading-snug">
                          <span className="font-bold text-slate-900">{activity.user}</span>{" "}
                          <span className="text-slate-500 font-medium">{activity.action}</span>{" "}
                          <span className="font-bold text-slate-900">{activity.target}</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{activity.time} • Cabinet</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                  <Button variant="ghost" className="h-7 w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">Voir tout l'historique</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="h-4 w-[1px] bg-slate-100 mx-2" />

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="h-10 rounded-lg gap-3 hover:bg-slate-50 transition-all px-2">
                  <Avatar className="h-7 w-7 border border-slate-100 shadow-sm">
                    <AvatarFallback className="bg-slate-900 text-white font-bold text-[10px]">
                      DM
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left hidden sm:flex">
                    <span className="text-[12px] font-semibold text-slate-900 leading-none">Dr. Martin</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">Ophtalmologue</span>
                  </div>
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-lg border-slate-100">
                <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-wider text-slate-400 px-3 py-2">Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuItem className="rounded-lg gap-2 py-2 focus:bg-slate-50 focus:text-slate-900 cursor-pointer text-[13px] font-medium">
                  <User className="h-4 w-4 text-slate-400" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg gap-2 py-2 focus:bg-slate-50 focus:text-slate-900 cursor-pointer text-[13px] font-medium">
                  <Settings className="h-4 w-4 text-slate-400" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuItem className="rounded-lg gap-2 py-2 focus:bg-rose-50 focus:text-rose-600 text-rose-500 cursor-pointer text-[13px] font-medium">
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFDFD] p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
