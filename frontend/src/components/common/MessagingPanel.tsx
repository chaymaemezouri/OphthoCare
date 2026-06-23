'use client';

import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Loader2, Megaphone, MessageSquare, Plus, Send } from 'lucide-react';
import { useMessaging } from '@/hooks/useMessaging';
import { useAuth } from '@/hooks/use-auth';
import { messagingApi } from '@/lib/api/messaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type MessagingPanelProps = {
  /** Mode patient : interface simplifiée, mobile-first */
  variant?: 'default' | 'patient';
};

export function MessagingPanel({ variant = 'default' }: MessagingPanelProps) {
  const { user } = useAuth();
  const {
    connected,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    typingUserId,
    loadingConversations,
    loadingMessages,
    loadConversations,
    sendMessage,
    sendTyping,
    currentUserId,
  } = useMessaging();

  const [draft, setDraft] = useState('');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [spaces, setSpaces] = useState<{ doctorSpaceId: string; name: string }[]>([]);
  const [pickSpace, setPickSpace] = useState('');
  const [bSubject, setBSubject] = useState('');
  const [bContent, setBContent] = useState('');
  const [bFilter, setBFilter] = useState<'ALL' | 'ACTIVE_LAST_30D' | 'CHRONIC'>('ALL');
  const bottomRef = useRef<HTMLDivElement>(null);

  const isPatient = user?.role === 'patient' || variant === 'patient';
  const isDoctor = user?.role === 'doctor';
  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const showMobileChat = Boolean(activeConversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  const submit = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  const openNewConversation = async () => {
    const data = await messagingApi.eligibleSpaces();
    setSpaces(data.items);
    setNewConvOpen(true);
  };

  const startConversation = async () => {
    if (!pickSpace) return;
    const row = await messagingApi.createConversation(pickSpace);
    setNewConvOpen(false);
    setPickSpace('');
    await loadConversations();
    setActiveConversationId(row.id);
  };

  const sendBroadcast = async () => {
    await messagingApi.broadcast({
      subject: bSubject,
      content: bContent,
      recipientFilter: bFilter,
    });
    setBroadcastOpen(false);
    setBSubject('');
    setBContent('');
  };

  return (
    <div
      className={cn(
        'flex overflow-hidden bg-white',
        isPatient
          ? 'h-[min(680px,calc(100vh-14rem))] md:h-[min(720px,calc(100vh-12rem))]'
          : 'h-[min(720px,calc(100vh-12rem))] rounded-xl border border-slate-200 shadow-sm',
      )}
    >
      {/* Liste des conversations */}
      <aside
        className={cn(
          'flex w-full flex-col border-r border-slate-200 bg-slate-50 md:w-72 lg:w-80',
          isPatient && showMobileChat && 'hidden md:flex',
        )}
      >
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Conversations</p>
            <Badge
              variant={connected ? 'default' : 'secondary'}
              className={cn('text-[10px]', connected && 'bg-emerald-600')}
            >
              {connected ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </div>
          {isPatient ? (
            <Button
              size="sm"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700"
              onClick={() => void openNewConversation()}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Contacter un cabinet
            </Button>
          ) : null}
          {isDoctor ? (
            <Button size="sm" variant="outline" className="w-full rounded-lg text-xs" onClick={() => setBroadcastOpen(true)}>
              <Megaphone className="mr-1 h-3 w-3" />
              Diffusion
            </Button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <p className="flex items-center gap-2 p-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </p>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <MessageSquare className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-700">Aucun message</p>
              <p className="text-xs text-slate-500">
                {isPatient
                  ? 'Contactez le secrétariat d’un cabinet pour poser une question.'
                  : 'Les conversations apparaîtront ici.'}
              </p>
              {isPatient ? (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => void openNewConversation()}>
                  Nouvelle conversation
                </Button>
              ) : null}
            </div>
          ) : (
            <ul>
              {conversations.map((c) => {
                const active = activeConversationId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveConversationId(c.id)}
                      className={cn(
                        'w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-white',
                        active && 'border-l-2 border-l-blue-600 bg-white',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {isPatient ? c.doctorSpaceName : c.patientName}
                        </p>
                        {c.unreadCount > 0 ? (
                          <Badge className="h-5 min-w-5 shrink-0 justify-center bg-blue-600 px-1.5 text-[10px]">
                            {c.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{c.lastMessagePreview || '—'}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {format(parseISO(c.lastMessageAt), 'd MMM · HH:mm', { locale: fr })}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Fil de discussion */}
      <section
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          isPatient && !showMobileChat && 'hidden md:flex',
        )}
      >
        {!activeConversationId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-slate-500">
            <MessageSquare className="h-12 w-12 text-slate-200" strokeWidth={1.25} />
            <p className="text-sm font-medium text-slate-700">Sélectionnez une conversation</p>
            <p className="text-xs text-slate-500">Ou démarrez un échange avec un cabinet.</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              {isPatient ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-lg md:hidden"
                  onClick={() => setActiveConversationId(null)}
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : null}
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {isPatient ? activeConv?.doctorSpaceName : activeConv?.patientName}
                </p>
                {typingUserId ? (
                  <p className="text-xs text-emerald-600">Écrit en ce moment…</p>
                ) : (
                  <p className="text-xs text-slate-500">Messagerie sécurisée</p>
                )}
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
              {loadingMessages ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Aucun message — commencez la conversation.</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === currentUserId;
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                          mine
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 bg-white text-slate-900',
                        )}
                      >
                        {!mine ? (
                          <p className="mb-0.5 text-[10px] font-semibold text-slate-500">{m.senderName}</p>
                        ) : null}
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        <p className={cn('mt-1 text-[10px]', mine ? 'text-blue-100' : 'text-slate-400')}>
                          {format(parseISO(m.createdAt), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <footer className="flex gap-2 border-t border-slate-200 bg-white p-3">
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  sendTyping(true);
                }}
                onBlur={() => sendTyping(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Écrire un message…"
                className="rounded-lg border-slate-300"
              />
              <Button
                className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700"
                onClick={submit}
                disabled={!draft.trim()}
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </Button>
            </footer>
          </>
        )}
      </section>

      <Dialog open={newConvOpen} onOpenChange={setNewConvOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contacter un cabinet</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Choisissez le cabinet avec lequel vous souhaitez échanger.</p>
          <Select value={pickSpace} onValueChange={(v) => v && setPickSpace(v)}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Sélectionner un cabinet" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((s) => (
                <SelectItem key={s.doctorSpaceId} value={s.doctorSpaceId}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button className="rounded-lg bg-blue-600 hover:bg-blue-700" onClick={() => void startConversation()} disabled={!pickSpace}>
              Démarrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Diffusion patients</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={bFilter} onValueChange={(v) => v && setBFilter(v as typeof bFilter)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les patients</SelectItem>
                <SelectItem value="ACTIVE_LAST_30D">Actifs 30 jours</SelectItem>
                <SelectItem value="CHRONIC">Suivi chronique</SelectItem>
              </SelectContent>
            </Select>
            <Input value={bSubject} onChange={(e) => setBSubject(e.target.value)} placeholder="Sujet" className="rounded-lg" />
            <textarea
              value={bContent}
              onChange={(e) => setBContent(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              placeholder="Message…"
            />
          </div>
          <DialogFooter>
            <Button className="rounded-lg" onClick={() => void sendBroadcast()}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
