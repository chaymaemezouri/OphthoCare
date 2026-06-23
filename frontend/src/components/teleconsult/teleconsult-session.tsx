"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  FileText,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Settings,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useTeleconsultRoom } from "@/hooks/use-teleconsult-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TeleconsultSession({
  appointmentId,
  role,
  onLeave,
}: {
  appointmentId: string;
  role: "doctor" | "patient" | "secretary";
  onLeave: () => void;
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    context,
    chat,
    localStream,
    remoteStream,
    connected,
    error,
    joining,
    sendChat,
    endSession,
    toggleMute,
    toggleVideo,
  } = useTeleconsultRoom({ appointmentId, role, enabled: true });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (context?.appointment.notes) setNotes(context.appointment.notes);
  }, [context?.appointment.notes]);

  const patientName = context?.patient.displayName ?? "Patient";

  const handleEnd = async () => {
    await endSession(role === "doctor" ? notes : undefined);
    onLeave();
  };

  const handleSendChat = async () => {
    const text = chatDraft.trim();
    if (!text) return;
    setChatDraft("");
    await sendChat(text);
  };

  if (joining && !localStream) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-sm">Connexion à la salle et accès caméra/micro…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-6xl flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={onLeave}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50">
            <Video className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-none text-slate-900">Téléconsultation</h2>
            <p className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  connected ? "animate-pulse bg-emerald-500" : "bg-amber-400",
                )}
              />
              {patientName} · {formatDuration(elapsed)}
              {connected ? " · Connecté" : " · En attente du patient"}
            </p>
          </div>
        </div>
        {role === "doctor" || role === "secretary" ? (
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-slate-200 text-xs font-semibold"
            asChild
          >
            <Link
              href={
                role === "secretary"
                  ? `/dashboard/secretaire/patients/${context?.patient.id}`
                  : `/dashboard/medecin/patients/${context?.patient.id}?tab=ordonnances`
              }
            >
              <FileText className="mr-2 h-3.5 w-3.5 text-slate-400" />
              Dossier patient
            </Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-6">
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn("absolute inset-0 h-full w-full object-cover", !remoteStream && "opacity-0")}
          />
          {!remoteStream ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Avatar className="h-28 w-28 border-4 border-slate-800">
                <AvatarFallback className="bg-slate-800 text-3xl font-bold text-slate-500">
                  {initials(patientName)}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm">En attente de la vidéo du patient…</p>
              <p className="max-w-xs text-center text-xs text-slate-500">
                Le patient doit ouvrir le lien visio depuis ses rendez-vous (type Visio).
              </p>
            </div>
          ) : null}

          <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <span className="text-[11px] font-bold text-white">{patientName}</span>
          </div>

          <div className="absolute right-6 top-6 aspect-video w-44 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn("h-full w-full object-cover", isVideoOff && "hidden")}
            />
            {isVideoOff ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff className="h-6 w-6 text-slate-600" />
              </div>
            ) : null}
            <div className="absolute bottom-2 left-2 rounded border border-white/5 bg-black/40 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              Vous
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-3 shadow-2xl backdrop-blur-xl">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-xl",
                isMuted ? "bg-rose-500 text-white hover:bg-rose-600" : "text-white hover:bg-white/10",
              )}
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                toggleMute(next);
              }}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-xl",
                isVideoOff ? "bg-rose-500 text-white hover:bg-rose-600" : "text-white hover:bg-white/10",
              )}
              onClick={() => {
                const next = !isVideoOff;
                setIsVideoOff(next);
                toggleVideo(next);
              }}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            <div className="mx-2 h-6 w-px bg-white/10" />
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-white hover:bg-white/10">
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              className="ml-4 h-11 rounded-xl bg-rose-500 px-6 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600"
              onClick={() => void handleEnd()}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              Terminer
            </Button>
          </div>
        </div>

        <div className="flex w-80 flex-col gap-4">
          <Card className="flex flex-1 flex-col overflow-hidden border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-slate-900">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                Chat
              </h3>
            </div>
            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
              {chat.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[90%] rounded-xl p-3 text-[12px] leading-relaxed",
                    m.senderRole === role
                      ? "ml-auto rounded-tr-none bg-rose-500 text-white"
                      : "rounded-tl-none bg-slate-50 text-slate-700",
                  )}
                >
                  <p className="font-semibold text-[10px] opacity-80">{m.senderName}</p>
                  <p className="mt-0.5">{m.body}</p>
                  <span className="mt-1 block text-[9px] uppercase opacity-60">
                    {format(parseISO(m.createdAt), "HH:mm", { locale: fr })}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-slate-50 bg-slate-50/50 p-4">
              <div className="flex gap-2">
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendChat();
                    }
                  }}
                  placeholder="Écrire un message…"
                  className="h-10 flex-1 rounded-lg border border-slate-200 bg-white pl-3 pr-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
                <Button type="button" size="icon" className="h-10 w-10 shrink-0 rounded-lg" onClick={() => void handleSendChat()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {role === "doctor" && context ? (
            <Card className="border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-slate-900">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Dossier rapide
              </h3>
              <p className="text-[12px] font-bold text-slate-900">{context.patient.displayName}</p>
              {context.patient.age != null ? (
                <p className="text-[10px] text-slate-500">{context.patient.age} ans</p>
              ) : null}
              {context.patient.allergies.length > 0 ? (
                <p className="mt-2 text-[11px] text-slate-600">
                  <span className="font-semibold">Allergies :</span> {context.patient.allergies.join(", ")}
                </p>
              ) : null}
              <textarea
                className="mt-3 min-h-[72px] w-full resize-y rounded-lg border border-slate-200 p-2 text-[11px]"
                placeholder="Notes de fin de consultation…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {context.appointment.reason ? (
                <p className="mt-2 text-[11px] text-slate-500">Motif : {context.appointment.reason}</p>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
