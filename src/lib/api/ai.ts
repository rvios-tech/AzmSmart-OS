// ---------------------------------------------------------------------------
// RVIOS AI — مساعد التاجر. كل المسارات داخل متجر: الخادم يتحقق أن المتجر لشركة
// الجلسة وأن المحادثة لصاحبها. المساعد استشاري: لا شيء هنا يكتب في المتجر.
// ---------------------------------------------------------------------------

import { apiFetch, streamSse, type SseEvent } from "./client";

const base = (storeId: string) => `/shop/stores/${storeId}/ai`;

export type AiMode = "chat" | "insights";

export interface AiStatus {
  ready: boolean;
  plan: string;
  used: number;
  limit: number;
  resetsAt: string;
  tokens: { input: number; output: number; thoughts: number };
}

export interface AiConversationSummary {
  id: string;
  title: string;
  mode: AiMode;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  role: "user" | "model";
  content: string;
  /** ok · stopped · error — وفي الواجهة أيضًا: streaming */
  status: "ok" | "stopped" | "error" | "streaming";
  createdAt: string;
}

export interface AiConversation extends Omit<AiConversationSummary, "messageCount"> {
  messages: AiMessage[];
}

export type AiStreamEvent =
  | { type: "start"; conversationId: string; userMessageId: string | null; mode: AiMode }
  | { type: "delta"; text: string }
  | { type: "title"; title: string }
  | { type: "done"; messageId: string; status: "ok" | "stopped"; used: number; limit: number }
  | { type: "error"; code: string; message: string; messageId: string | null };

export const getAiStatus = (storeId: string) => apiFetch<AiStatus>(`${base(storeId)}/status`);

export const listAiConversations = (storeId: string) =>
  apiFetch<AiConversationSummary[]>(`${base(storeId)}/conversations`);

export const getAiConversation = (storeId: string, id: string) =>
  apiFetch<AiConversation>(`${base(storeId)}/conversations/${id}`);

export const renameAiConversation = (storeId: string, id: string, title: string) =>
  apiFetch<{ id: string; title: string }>(`${base(storeId)}/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });

export const deleteAiConversation = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${base(storeId)}/conversations/${id}`, { method: "DELETE" });

export function streamAiChat(
  storeId: string,
  body: { conversationId?: string; message?: string; mode?: AiMode; regenerate?: boolean },
  onEvent: (e: AiStreamEvent) => void,
  signal?: AbortSignal,
) {
  return streamSse<AiStreamEvent>(`${base(storeId)}/chat`, body, (e: SseEvent<AiStreamEvent>) => onEvent(e.data), signal);
}

// ── أدوات الكتابة ──────────────────────────────────────────────────────────

export type AiLang = "ar" | "en";

export interface AiProductResult {
  title: string;
  summary: string;
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
}
export interface AiMarketingResult {
  items: { text: string; hashtags: string[] }[];
  tips: string[];
}
export interface AiSeoResult {
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  improvements: string[];
  improvedDescription: string;
}

export interface AiProductInput { name: string; category?: string; details?: string; audience?: string; tone?: string }
export interface AiMarketingInput { topic: string; platform: string; tone?: string; goal?: string; occasion?: string; offer?: string; count?: number }
export interface AiSeoInput { name: string; description?: string; keywords?: string; city?: string }

type ToolMap = {
  product: { input: AiProductInput; result: AiProductResult };
  marketing: { input: AiMarketingInput; result: AiMarketingResult };
  seo: { input: AiSeoInput; result: AiSeoResult };
};

export function aiGenerate<K extends keyof ToolMap>(storeId: string, tool: K, language: AiLang, input: ToolMap[K]["input"]) {
  return apiFetch<{ tool: K; result: ToolMap[K]["result"]; used: number; limit: number }>(`${base(storeId)}/generate`, {
    method: "POST",
    body: JSON.stringify({ tool, language, [tool]: input }),
  });
}
