"use client";

import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AiChatComposer({
  value,
  onChange,
  onSend,
  placeholder = "Posez votre question…",
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend?.();
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="rounded-full bg-gradient-to-r from-sky-400 via-violet-400 via-fuchsia-400 to-orange-400 p-[1.5px] shadow-sm">
        <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="min-h-11 flex-1 border-0 bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400 disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !value.trim()}
            className="h-10 w-10 shrink-0 rounded-full border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40"
            aria-label="Envoyer"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
