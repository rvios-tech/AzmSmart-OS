// ---------------------------------------------------------------------------
// إدارة RVIOS AI من لوحة المنصة: معرفة يضيفها الفريق فيسترجعها المساعد حسب السؤال،
// واختبار ما سيقرؤه لسؤال بعينه، وأرقام الاستهلاك. فريق المنصة وحده (يفرضه الخادم).
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type AiAudience = "merchant" | "public";

export interface AiKnowledgeEntry {
  id: string;
  title: string;
  tags: string[];
  audience: AiAudience[];
  text: string;
  active: boolean;
  updatedAt: string;
}

export interface AiKnowledgeList {
  entries: AiKnowledgeEntry[];
  builtin: { id: string; title: string; audience: AiAudience[]; chars: number }[];
}

export interface AiKnowledgeInput {
  title: string;
  tags: string[];
  audience: AiAudience[];
  text: string;
  active?: boolean;
}

interface Tokens { input: number; output: number; thoughts: number }
export interface AiUsageStats {
  since: string;
  merchant: { requests: number; tokens: Tokens; byFeature: Record<string, number> };
  topStores: { id?: string; name?: string; slug?: string; requests: number }[];
  public: { requests: number; today: number; tokens: Tokens; bySite: Record<string, number> };
}

export const listAiKnowledge = () => apiFetch<AiKnowledgeList>("/platform/ai/knowledge");

export const createAiKnowledge = (input: AiKnowledgeInput) =>
  apiFetch<AiKnowledgeEntry>("/platform/ai/knowledge", { method: "POST", body: JSON.stringify(input) });

export const updateAiKnowledge = (id: string, input: Partial<AiKnowledgeInput>) =>
  apiFetch<AiKnowledgeEntry>(`/platform/ai/knowledge/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteAiKnowledge = (id: string) =>
  apiFetch<{ ok: true }>(`/platform/ai/knowledge/${id}`, { method: "DELETE" });

export const testAiKnowledge = (question: string, audience: AiAudience) =>
  apiFetch<{ picked: { id: string; title: string; team: boolean }[] }>("/platform/ai/knowledge/test", {
    method: "POST",
    body: JSON.stringify({ question, audience }),
  });

export const getAiUsageStats = () => apiFetch<AiUsageStats>("/platform/ai/usage");
