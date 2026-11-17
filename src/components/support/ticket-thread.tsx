"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconSend } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS, type Ticket } from "@/lib/api/support";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** محادثة تذكرة — للتاجر وللفريق؛ رسائل الطرف الآخر على الجهة المقابلة */
export function TicketThread({ ticket, staff, onReply, actions }: {
  ticket: Ticket;
  staff?: boolean;
  onReply: (body: string) => Promise<Ticket>;
  actions?: React.ReactNode;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const st = TICKET_STATUS[ticket.status];
  async function send() {
    setBusy(true);
    try { await onReply(body.trim()); setBody(""); } catch (e) { toast.error(e instanceof ApiError ? e.message : "تعذّر الإرسال."); } finally { setBusy(false); }
  }
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-2 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">{ticket.ref}</span>
          <Badge variant="secondary" className={st.tone}>{staff ? st.staffLabel : st.label}</Badge>
          <Badge variant="outline">{TICKET_CATEGORY[ticket.category] ?? ticket.category}</Badge>
          {ticket.priority > 0 && <Badge variant="outline" className={ticket.priority === 2 ? "border-rose-500/50 text-rose-600" : ""}>{TICKET_PRIORITY[ticket.priority]}</Badge>}
          <div className="ms-auto flex gap-2">{actions}</div>
        </div>
        <h2 className="text-lg font-semibold">{ticket.subject}</h2>
        {staff && <p className="text-sm text-muted-foreground">{ticket.organization?.name}{ticket.store ? ` · ${ticket.store.name}` : ""}</p>}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {ticket.messages?.map((m) => {
          const mine = staff ? m.fromStaff : !m.fromStaff;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[85%] space-y-1 rounded-xl px-3.5 py-2.5 text-sm", mine ? "bg-primary/10" : "bg-muted")}>
                <p className="text-xs font-medium text-muted-foreground">{m.fromStaff ? (staff ? m.author.displayName : "فريق RVIOS") : m.author.displayName} · {formatRelativeTime(m.createdAt)}</p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2 border-t pt-3">
        <Textarea rows={3} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder={ticket.status === 2 ? "اكتب لإعادة فتح التذكرة…" : "اكتب ردّك…"} />
        <Button size="sm" disabled={busy || !body.trim()} onClick={() => void send()}>
          {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />} إرسال
        </Button>
      </div>
    </div>
  );
}
