"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { doctorToolsApi, type DoctorMessage } from "@/lib/api/doctor-tools";
import { doctorsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CabinetPatientMessages({
  title = "Communication patients",
  subtitle = "Messages cabinet → notification in-app patient",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [patientId, setPatientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [msg, pts] = await Promise.all([
        doctorToolsApi.listMessages(),
        doctorsApi.getMyPatients({ take: 200 }),
      ]);
      setMessages(msg.items);
      setPatients(
        pts.items.map((p) => ({
          id: p.id,
          name: p.displayName || p.email || p.id,
        })),
      );
    } catch {
      toast.error("Impossible de charger les messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!patientId || !subject.trim() || !body.trim()) {
      toast.error("Remplissez tous les champs");
      return;
    }
    setSending(true);
    try {
      await doctorToolsApi.sendMessage({
        patientId,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success("Message envoyé au patient");
      setOpen(false);
      setSubject("");
      setBody("");
      setPatientId("");
      await load();
    } catch {
      toast.error("Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-[13px] text-slate-500">{subtitle}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau message
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun message envoyé.</p>
          ) : (
            <ul className="divide-y">
              {messages.map((m) => (
                <li key={m.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{m.patientName}</p>
                    <p className="text-sm text-slate-800">{m.subject}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{m.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {format(parseISO(m.createdAt), "PPp", { locale: fr })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message au patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Patient</Label>
              <Select value={patientId} onValueChange={(v) => setPatientId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objet</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={sending} onClick={() => void send()}>
              <Send className="mr-2 h-4 w-4" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
