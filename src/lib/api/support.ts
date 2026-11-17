import { apiFetch } from "./client";

/** 0 بانتظار الفريق · 1 بانتظار ردّك · 2 مغلقة */
export type TicketStatus = 0 | 1 | 2;
export const TICKET_STATUS: Record<TicketStatus, { label: string; staffLabel: string; tone: string }> = {
  0: { label: "بانتظار فريق RVIOS", staffLabel: "بانتظار ردّنا", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  1: { label: "ردّ الفريق", staffLabel: "بانتظار التاجر", tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  2: { label: "مغلقة", staffLabel: "مغلقة", tone: "bg-slate-500/10 text-slate-500" },
};
export const TICKET_CATEGORY: Record<string, string> = { store: "متجري", billing: "الاشتراك والفواتير", technical: "مشكلة تقنية", domain: "النطاق الخاص", other: "أخرى" };
export const TICKET_PRIORITY = ["عادية", "مهمة", "عاجلة — المتجر متوقف"] as const;

export interface TicketMessage { id: string; body: string; fromStaff: boolean; createdAt: string; author: { displayName: string } }
export interface Ticket {
  id: string; ref: string; subject: string; category: string; priority: number; status: TicketStatus;
  lastMessageAt: string; createdAt: string; storeId: string | null;
  store?: { name: string; slug?: string } | null;
  organization?: { name: string };
  _count?: { messages: number };
  messages?: TicketMessage[];
}

export const listTickets = () => apiFetch<Ticket[]>("/support/tickets");
export const getTicket = (id: string) => apiFetch<Ticket>(`/support/tickets/${id}`);
export const createTicket = (input: { subject: string; category: string; priority?: number; body: string; storeId?: string }) =>
  apiFetch<Ticket>("/support/tickets", { method: "POST", body: JSON.stringify(input) });
export const replyTicket = (id: string, body: string) => apiFetch<Ticket>(`/support/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) });
export const closeTicket = (id: string) => apiFetch<Ticket>(`/support/tickets/${id}/close`, { method: "POST" });

export const platformTickets = (status?: number) =>
  apiFetch<{ tickets: Ticket[]; counts: Record<number, number> }>(`/platform/support${status !== undefined ? `?status=${status}` : ""}`);
export const platformTicket = (id: string) => apiFetch<Ticket>(`/platform/support/${id}`);
export const platformReply = (id: string, body: string) => apiFetch<Ticket>(`/platform/support/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) });
export const platformTicketStatus = (id: string, status: TicketStatus) =>
  apiFetch<Ticket>(`/platform/support/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
