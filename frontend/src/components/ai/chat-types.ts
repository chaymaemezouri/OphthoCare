export type AiChatUserMessage = {
  role: "user";
  content: string;
  time?: string;
};

export type AiChatAssistantTextMessage = {
  role: "assistant";
  variant?: "text";
  content: string;
  time?: string;
};

export type AiChatAssistantCardMessage = {
  role: "assistant";
  variant: "card";
  title: string;
  rating?: number;
  date?: string;
  duration?: string;
  location?: string;
  ctaLabel?: string;
  time?: string;
};

export type AiChatMessage =
  | AiChatUserMessage
  | AiChatAssistantTextMessage
  | AiChatAssistantCardMessage;

export function isAssistantCard(
  msg: AiChatMessage,
): msg is AiChatAssistantCardMessage {
  return msg.role === "assistant" && msg.variant === "card";
}
