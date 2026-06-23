"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AiChatThread } from "@/components/ai/ai-chatbot";
import type { AiChatMessage } from "@/components/ai/chat-types";
import { doctorToolsApi } from "@/lib/api/doctor-tools";
import { Badge } from "@/components/ui/badge";
import { DoctorPageHeader } from "@/components/doctor/doctor-page-header";
import { DoctorPageShell } from "@/components/doctor/doctor-page-shell";
import { DOCTOR_CARD } from "@/components/doctor/doctor-dashboard-shell";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-auth";

const suggestions = [
  "Résumer les signes d'alerte d'un glaucome aigu",
  "Proposer une structure de compte rendu post-opératoire",
  "Quels examens compléter pour une excavation à 0,8 ?",
];

export default function AIAssistantPage() {
  useRequireAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content:
        "Bonjour. Posez une question clinique ou demandez de l'aide pour rédiger un compte rendu. " +
        "Configurez OPENAI_API_KEY dans Backend/.env pour des réponses enrichies.",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
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
      const res = await doctorToolsApi.aiChat({ messages: history });
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
          content: "Erreur de connexion à l'assistant. Réessayez.",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="medecin">
      <DoctorPageShell className="flex min-h-[calc(100vh-3.5rem)] flex-col space-y-6">
        <DoctorPageHeader
          title="Assistant IA"
          description={disclaimer ?? "Questions cliniques, rédaction et protocoles — à valider avant usage."}
          variant="compact"
          actions={
            loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
            ) : (
              <Badge className="bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">En ligne</Badge>
            )
          }
        />
        <div className={cn(DOCTOR_CARD, "min-h-0 flex-1 overflow-hidden")}>
          <AiChatThread
            messages={messages}
            suggestions={suggestions}
            headerTitle="Assistant clinique OphthoCare"
            placeholder="Question clinique, rédaction, protocole…"
            className="h-full min-h-[420px]"
            onSendMessage={(t) => void onSend(t)}
          />
        </div>
      </DoctorPageShell>
    </DashboardLayout>
  );
}
