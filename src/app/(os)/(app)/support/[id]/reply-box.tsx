"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconSend,
  IconPaperclip,
  IconMoodSmile,
  IconCircleCheck,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReplyBox({
  ticketId,
  agentName,
  agentAvatar,
}: {
  ticketId: string;
  agentName: string;
  agentAvatar: string;
}) {
  const [value, setValue] = useState("");

  function send() {
    if (!value.trim()) {
      toast.error("الرد فارغ", {
        description: "اكتب رسالة قبل الإرسال.",
      });
      return;
    }
    toast.success("تم إرسال الرد", {
      description: `وصلت رسالتك على ${ticketId} إلى العميل.`,
    });
    setValue("");
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <Avatar className="size-7">
          <AvatarImage src={agentAvatar} alt={agentName} />
          <AvatarFallback>{agentName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium">Reply as {agentName}</p>
      </div>
      <div className="p-4">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="اكتب رداً على العميل…"
          rows={4}
          className="resize-none border-0 p-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() =>
              toast("إرفاق ملف", { description: "اسحب ملفاً هنا أو تصفّح جهازك." })
            }
          >
            <IconPaperclip className="size-4" />
            <span className="sr-only">إرفاق ملف</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() => toast("إدراج رمز تعبيري")}
          >
            <IconMoodSmile className="size-4" />
            <span className="sr-only">إدراج رمز تعبيري</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              toast.success("تم حل التذكرة", {
                description: `تم وضع ${ticketId} كمحلولة.`,
              })
            }
          >
            <IconCircleCheck className="size-4" /> وضعها كمحلولة
          </Button>
          <Button type="button" onClick={send}>
            <IconSend className="size-4" /> إرسال الرد
          </Button>
        </div>
      </div>
    </div>
  );
}
