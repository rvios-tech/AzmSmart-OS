import { apiFetch } from "./client";

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  role: number;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface CreatedApiKey extends ApiKeySummary {
  /** السرّ الكامل — يظهر مرة واحدة فقط، عند الإنشاء. لا يُعاد بعدها أبدًا. */
  secret: string;
}

export const listApiKeys = () => apiFetch<ApiKeySummary[]>("/developer/keys");

export const createApiKey = (input: { name: string; role: number }) =>
  apiFetch<CreatedApiKey>("/developer/keys", { method: "POST", body: JSON.stringify(input) });

export const revokeApiKey = (id: string) =>
  apiFetch<{ ok: true }>(`/developer/keys/${id}`, { method: "DELETE" });

/* ───────── خطافات الويب ───────── */

export interface WebhookEventDef {
  id: string;
  label: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt: string | null;
  lastStatus: number | null;
  secretHint: string;
  createdAt: string;
}

export interface WebhookWithSecret extends Webhook {
  /** سرّ التوقيع كاملًا — يظهر عند الإنشاء والتدوير فقط. */
  secret: string;
}

/** 0=بانتظار الإرسال · 1=نجح · 2=فشل نهائيًا */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: unknown;
  status: 0 | 1 | 2;
  attempts: number;
  responseCode: number | null;
  error: string | null;
  nextAttemptAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

const W = "/developer/webhooks";

export const listWebhookEvents = () => apiFetch<WebhookEventDef[]>(`${W}/events`);
export const listWebhooks = () => apiFetch<Webhook[]>(W);
export const createWebhook = (input: { url: string; events: string[] }) =>
  apiFetch<WebhookWithSecret>(W, { method: "POST", body: JSON.stringify(input) });
export const updateWebhook = (id: string, input: { url?: string; events?: string[]; isActive?: boolean }) =>
  apiFetch<Webhook>(`${W}/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteWebhook = (id: string) => apiFetch<{ ok: true }>(`${W}/${id}`, { method: "DELETE" });
export const rotateWebhookSecret = (id: string) =>
  apiFetch<WebhookWithSecret>(`${W}/${id}/rotate-secret`, { method: "POST" });
export const testWebhook = (id: string) => apiFetch<WebhookDelivery>(`${W}/${id}/test`, { method: "POST" });
export const listWebhookDeliveries = (id: string) => apiFetch<WebhookDelivery[]>(`${W}/${id}/deliveries`);
export const redeliverWebhook = (deliveryId: string) =>
  apiFetch<WebhookDelivery>(`${W}/deliveries/${deliveryId}/redeliver`, { method: "POST" });
