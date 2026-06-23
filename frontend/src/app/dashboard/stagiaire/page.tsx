"use client";

import { useState } from "react";
import { Loader2, Bot, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiChatThread } from "@/components/ai/ai-chatbot";
import type { AiChatMessage } from "@/components/ai/chat-types";
import { traineeLearningApi } from "@/lib/api/trainee-learning";
import { useRequireAuth } from "@/hooks/use-auth";

const suggestions = [
  "Explique le bilan d'un glaucome chronique",
  "Quels signes orientent vers une urgence rétinienne ?",
  "Comment structurer l'interprétation d'un OCT maculaire ?",
];

export default function StagiaireIaPage() {
  useRequireAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre tuteur IA. Posez des questions sur les concepts cliniques — " +
        "je ne remplace pas le jugement du médecin responsable.",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  const onSend = async (text: string) => {
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const userMsg: AiChatMessage = { role: "user", content: text, time };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const history = next
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: "content" in m ? m.content : "",
        }));
      const res = await traineeLearningApi.aiChat({
        messages: history,
        sessionId,
      });
      setSessionId(res.sessionId);
      setDisclaimer(res.disclaimer);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erreur de connexion au tuteur IA. Réessayez.",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="stagiaire">
      <div className="mx-auto flex h-[calc(100vh-140px)] max-w-6xl flex-col gap-4">
        <div className="flex shrink-0 items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Bot className="h-5 w-5" />
              Assistant IA pédagogique
            </h2>
            {disclaimer ? (
              <p className="text-xs text-amber-800 mt-1 max-w-2xl">{disclaimer}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Contenu à visée pédagogique — vérifiez avec votre superviseur.
              </p>
            )}
          </div>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <Sparkles className="h-5 w-5 text-emerald-500" />}
        </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-slate-100">
          <AiChatThread
            messages={messages}
            suggestions={suggestions}
            headerTitle="Tuteur clinique OphthoCare"
            placeholder="Question pédagogique, concept, protocole…"
            className="min-h-0 flex-1"
            onSendMessage={(t) => void onSend(t)}
          />
          <p className="border-t border-slate-50 px-6 py-3 text-center text-[9px] font-bold uppercase tracking-widest text-slate-300">
            IA à visée pédagogique • Ne pas utiliser pour décider seul d&apos;une prise en charge
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
