"use client";

import { useState } from "react";
import {
  Calendar,
  Copy,
  MapPin,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AiChatMessage } from "@/components/ai/chat-types";
import { isAssistantCard } from "@/components/ai/chat-types";

function AiAvatar() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-50 to-orange-100 ring-1 ring-orange-200/80"
      aria-hidden
    >
      <span className="text-sm font-bold tracking-tight text-orange-600">O</span>
    </div>
  );
}

function AssistantActions({ content, className }: { content: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        title={copied ? "Copié" : "Copier"}
        aria-label="Copier la réponse"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        title="Utile"
        aria-label="Réponse utile"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        title="Pas utile"
        aria-label="Réponse pas utile"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      {copied ? <span className="ml-1 text-[10px] font-medium text-emerald-600">Copié</span> : null}
    </div>
  );
}

function GradientCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-r from-sky-400 via-violet-400 via-fuchsia-400 to-orange-400 p-[1.5px]",
        className,
      )}
    >
      <div className="rounded-[calc(1rem-1.5px)] bg-white">{children}</div>
    </div>
  );
}

function AssistantCardBody({
  title,
  rating,
  date,
  duration,
  location,
  ctaLabel,
}: {
  title: string;
  rating?: number;
  date?: string;
  duration?: string;
  location?: string;
  ctaLabel?: string;
}) {
  return (
    <GradientCard className="max-w-md">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold leading-snug text-zinc-900">{title}</h4>
          {rating != null ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {rating}%
            </span>
          ) : null}
        </div>
        {(date || duration || location) && (
          <ul className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            {date ? (
              <li className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                {date}
              </li>
            ) : null}
            {date && duration ? <li className="text-zinc-300">•</li> : null}
            {duration ? <li>{duration}</li> : null}
            {location ? (
              <>
                {(date || duration) && <li className="text-zinc-300">•</li>}
                <li className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                  {location}
                </li>
              </>
            ) : null}
          </ul>
        )}
        {ctaLabel ? (
          <Button
            type="button"
            size="sm"
            className="mt-4 h-8 rounded-full bg-orange-500 px-4 text-xs font-semibold text-white hover:bg-orange-600"
          >
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </GradientCard>
  );
}

export function AiChatMessageRow({ message }: { message: AiChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end px-1">
        <div className="max-w-[min(85%,28rem)]">
          <p className="rounded-full bg-orange-500 px-5 py-3 text-[13px] font-medium leading-relaxed text-white shadow-sm shadow-orange-500/15">
            {message.content}
          </p>
          {message.time ? (
            <p className="mt-1.5 text-right text-[10px] font-medium text-zinc-400">{message.time}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const textContent = isAssistantCard(message) ? message.title : message.content;

  return (
    <div className="flex gap-3 px-1">
      <AiAvatar />
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        {isAssistantCard(message) ? (
          <AssistantCardBody
            title={message.title}
            rating={message.rating}
            date={message.date}
            duration={message.duration}
            location={message.location}
            ctaLabel={message.ctaLabel}
          />
        ) : (
          <p className="max-w-2xl whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-800">
            {message.content}
          </p>
        )}
        <AssistantActions content={textContent} />
        {message.time ? <p className="text-[10px] font-medium text-zinc-400">{message.time}</p> : null}
      </div>
    </div>
  );
}
