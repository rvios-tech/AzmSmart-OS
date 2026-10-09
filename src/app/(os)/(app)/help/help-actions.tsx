"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconSearch,
  IconMail,
  IconMessageCircle,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HelpSearch() {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    toast(`جارٍ البحث عن «${q}»`, {
      description: "تُعرض المقالات الأكثر صلة.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative mx-auto max-w-lg">
      <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن المقالات والأدلة وغيرها…"
        className="h-11 ps-10"
      />
    </form>
  );
}

/**
 * Clickable wrapper that fires a toast. Renders server-provided children
 * (icons, text, cards) so it can replace inert `<Link href="#">` targets.
 */
export function ClickToast({
  message,
  description,
  className,
  children,
}: {
  message: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        toast(message, description ? { description } : undefined)
      }
      className={className}
    >
      {children}
    </button>
  );
}

export function SupportButtons() {
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() =>
          toast.success("تم إنشاء طلب الدعم", {
            description: "سيرد فريقنا خلال 24 ساعة.",
          })
        }
      >
        <IconMail className="size-4" /> تواصل مع الدعم
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("محادثة مباشرة", {
            description: "جارٍ توصيلك بموظف متاح…",
          })
        }
      >
        <IconMessageCircle className="size-4" /> محادثة مباشرة
      </Button>
    </div>
  );
}
