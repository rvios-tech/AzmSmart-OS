"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconAddressBook,
  IconBriefcase,
  IconBuildingStore,
  IconExternalLink,
  IconLoader2,
  IconMail,
  IconPhone,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { listClients, type ApiClient } from "@/lib/api/clients";
import { listStoreCustomers, type StoreCustomer } from "@/lib/api/shop";
import { listTeamMembers, type TeamMember } from "@/lib/api/workspace";
import { formatMoney, formatNumber } from "@/lib/format";
import { initials } from "@/lib/work/view";
import { useStore } from "@/lib/shop/store-context";
import { useWorkspace } from "@/lib/workspace/workspace-context";

type Kind = "team" | "client" | "buyer";

interface Contact {
  id: string;
  kind: Kind;
  name: string;
  subtitle: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  href: string;
}

const KIND_LABEL: Record<Kind, string> = { team: "الفريق", client: "عميل أعمال", buyer: "مشترٍ من المتجر" };
const KIND_ICON: Record<Kind, React.ComponentType<{ className?: string }>> = {
  team: IconUsers,
  client: IconBriefcase,
  buyer: IconBuildingStore,
};

function fromTeam(m: TeamMember): Contact {
  return {
    id: `team-${m.id}`,
    kind: "team",
    name: m.user.displayName,
    subtitle: "عضو الفريق",
    email: m.user.email,
    phone: m.user.phone,
    avatar: m.user.avatarUrl,
    href: "/team",
  };
}

function fromClient(c: ApiClient): Contact {
  return {
    id: `client-${c.id}`,
    kind: "client",
    name: c.name,
    subtitle: c.city ? `عميل أعمال · ${c.city}` : "عميل أعمال",
    email: c.email,
    phone: c.phone,
    avatar: null,
    href: `/customers/${c.id}`,
  };
}

function fromBuyer(c: StoreCustomer, currency: string): Contact {
  return {
    id: `buyer-${c.id}`,
    kind: "buyer",
    name: c.name || c.phone,
    subtitle: `${formatNumber(c.ordersCount)} طلب · ${formatMoney(c.spent, currency)}`,
    email: null,
    phone: c.phone,
    avatar: null,
    href: "/store/customers",
  };
}

/** دفتر عناوين واحد يجمع فريقك وعملاء أعمالك ومشتري متجرك — كله حقيقي، لا كيان جديد. */
export default function ContactsPage() {
  const { showStore } = useWorkspace();
  const { store } = useStore();

  const [team, setTeam] = useState<Contact[] | null>(null);
  const [clients, setClients] = useState<Contact[] | null>(null);
  const [buyers, setBuyers] = useState<Contact[] | null>(null);
  const [tab, setTab] = useState<"all" | Kind>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const { members } = await listTeamMembers();
        setTeam(members.map(fromTeam));
      } catch (err) {
        setTeam([]);
        toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل الفريق.");
      }
    })();
    void (async () => {
      try {
        setClients((await listClients()).map(fromClient));
      } catch (err) {
        setClients([]);
        toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل عملاء الأعمال.");
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      if (!showStore) {
        setBuyers([]);
        return;
      }
      if (!store) return;
      try {
        const r = await listStoreCustomers(store.id);
        setBuyers(r.customers.map((c) => fromBuyer(c, store.currency)));
      } catch {
        setBuyers([]);
      }
    })();
  }, [store, showStore]);

  const loading = team === null || clients === null || (showStore && buyers === null);
  const all = useMemo(() => [...(team ?? []), ...(clients ?? []), ...(buyers ?? [])], [team, clients, buyers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (c) =>
        (tab === "all" || c.kind === tab) &&
        (!needle ||
          c.name.toLowerCase().includes(needle) ||
          c.email?.toLowerCase().includes(needle) ||
          c.phone?.includes(needle)),
    );
  }, [all, tab, q]);

  const tabs: { value: "all" | Kind; label: string }[] = [
    { value: "all", label: "الكل" },
    { value: "team", label: KIND_LABEL.team },
    { value: "client", label: KIND_LABEL.client },
    ...(showStore ? [{ value: "buyer" as const, label: KIND_LABEL.buyer }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="جهات الاتصال" description="فريقك وعملاء أعمالك — ومشترو متجرك إن وُجد — في دفتر واحد." />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="الفريق" value={formatNumber(team?.length ?? 0)} />
        <MetricCard label="عملاء الأعمال" value={formatNumber(clients?.length ?? 0)} />
        {showStore && <MetricCard label="مشترو المتجر" value={formatNumber(buyers?.length ?? 0)} />}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | Kind)}>
          <TabsList>{tabs.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}</TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث بالاسم أو البريد أو الجوال" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <IconAddressBook className="size-7 opacity-50" />
          <p>{all.length === 0 ? "لا جهات اتصال بعد." : "لا نتائج مطابقة."}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const Icon = KIND_ICON[c.kind];
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10">
                      <AvatarImage src={c.avatar ?? undefined} alt={c.name} />
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]"><Icon className="size-3" />{KIND_LABEL[c.kind]}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-foreground" dir="ltr"><IconMail className="size-3.5" />{c.email}</a>}
                    {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-foreground" dir="ltr"><IconPhone className="size-3.5" />{c.phone}</a>}
                  </div>
                  <Link href={c.href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    فتح <IconExternalLink className="size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
