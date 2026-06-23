"use client";

import { useState } from "react";
import { ChevronDown, Maximize2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AiChatMessage } from "@/components/ai/chat-types";
import { AiChatMessageRow } from "@/components/ai/chat-message";
import { AiChatComposer } from "@/components/ai/chat-composer";

export function AiChatHeader({
  title = "Nouvelle conversation avec l'IA",
  onClose,
  className,
}: {
  title?: string;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5",
        className,
      )}
    >
      <button
        type="button"
        className="flex min-w-0 items-center gap-1.5 text-left text-sm font-semibold text-zinc-900 transition-colors hover:text-zinc-600"
      >
        <span className="truncate">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
      </button>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700"
          aria-label="Renommer"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700"
          aria-label="Agrandir"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AiChatThread({
  messages,
  suggestions,
  showHeader = true,
  headerTitle,
  placeholder,
  className,
  onSendMessage,
}: {
  messages: AiChatMessage[];
  suggestions?: string[];
  showHeader?: boolean;
  headerTitle?: string;
  placeholder?: string;
  className?: string;
  onSendMessage?: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSendMessage?.(text);
    setDraft("");
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-white", className)}>
      {showHeader ? <AiChatHeader title={headerTitle} /> : null}

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 custom-scrollbar">
        {messages.map((msg, i) => (
          <AiChatMessageRow key={i} message={msg} />
        ))}
      </div>

      <div className="shrink-0 border-t border-zinc-100 bg-white px-5 py-4">
        <AiChatComposer
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          placeholder={placeholder}
        />
        {suggestions && suggestions.length > 0 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft(s)}
                className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-800"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
