"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Eye, 
  Shield, 
  ClipboardList, 
  GraduationCap, 
  ArrowRight,
  Lock,
  Mail,
  Fingerprint
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (role: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`Connecté en tant que ${role}`);
      if (role === "Médecin") router.push("/dashboard/medecin");
      else if (role === "Secrétaire") router.push("/dashboard/secretaire");
      else if (role === "Admin") router.push("/dashboard/admin");
      else if (role === "Stagiaire IA") router.push("/dashboard/stagiaire");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 font-sans antialiased">
      <Link href="/" className="flex items-center gap-3 mb-12 group">
        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
          <Eye className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-xl tracking-tight">OphthoCare</span>
      </Link>

      <Card className="w-full max-w-md border-slate-100 shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="text-center pt-10 pb-8">
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Bienvenue</CardTitle>
          <CardDescription className="text-[13px] text-slate-400 font-medium mt-2">Accédez à votre espace sécurisé</CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-10">
          <Tabs defaultValue="personnel" className="w-full">
            <TabsList className="grid grid-cols-2 mb-8 bg-slate-50 p-1 rounded-xl h-12 border border-slate-100">
              <TabsTrigger value="personnel" className="rounded-lg font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">
                Personnel
              </TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">
                Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personnel" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="grid gap-3">
                {[
                  { label: "Médecin", icon: Shield, role: "Médecin" },
                  { label: "Secrétaire", icon: ClipboardList, role: "Secrétaire" },
                  { label: "Stagiaire / IA", icon: GraduationCap, role: "Stagiaire IA" },
                ].map((item) => (
                  <Button 
                    key={item.label}
                    variant="outline" 
                    className="h-14 justify-between px-6 rounded-2xl border-slate-100 bg-slate-50/30 hover:border-slate-900 hover:bg-white hover:shadow-md transition-all group"
                    onClick={() => handleLogin(item.role)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                      <span className="font-bold text-slate-700 text-[13px]">{item.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-slate-900 transition-all" />
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="admin" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input id="email" type="email" placeholder="admin@ophtocare.fr" className="h-12 pl-11 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-200 text-[13px] font-medium" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input id="password" type="password" className="h-12 pl-11 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-200" />
                  </div>
                </div>
                <Button 
                  className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-slate-200 flex gap-2 mt-2" 
                  onClick={() => handleLogin("Admin")}
                  disabled={isLoading}
                >
                  <Fingerprint className="h-4 w-4" />
                  Authentification
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <p className="mt-12 text-slate-400 text-[12px] font-medium">
        Besoin d'aide ? <Link href="#" className="text-slate-900 font-bold hover:underline underline-offset-4">Support Technique</Link>
      </p>
    </div>
  );
}
