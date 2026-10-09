"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  IconCopy,
  IconMoon,
  IconSun,
  IconDeviceDesktop,
  IconPalette,
} from "@tabler/icons-react";

import {
  type ThemeConfig,
  defaultConfig,
  accents,
  radii,
  fonts,
  sidebarVariants,
  collapsibleModes,
  contentLayouts,
  buildThemeCss,
} from "@/lib/theme-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// السياق
// ---------------------------------------------------------------------------

type Ctx = {
  config: ThemeConfig;
  setConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  reset: () => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ThemeConfigContext = React.createContext<Ctx | null>(null);

export function useThemeConfig() {
  const ctx = React.useContext(ThemeConfigContext);
  if (!ctx) {
    // قيمة احتياطية آمنة كي تعمل المكوّنات خارج المزوّد (في الاختبارات مثلاً).
    return {
      config: defaultConfig,
      setConfig: () => {},
      reset: () => {},
      open: false,
      setOpen: () => {},
    } as Ctx;
  }
  return ctx;
}

const STORAGE_KEY = "azmsmart-theme-config";

export function ThemeConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = React.useState<ThemeConfig>(defaultConfig);
  const [open, setOpen] = React.useState(false);

  // تحميل الإعدادات المحفوظة مرة واحدة عند الإقلاع.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig({ ...defaultConfig, ...JSON.parse(raw) });
    } catch {
      // تجاهل
    }
  }, []);

  // تطبيق الإعدادات على المستند وحفظها.
  React.useEffect(() => {
    const root = document.documentElement;
    const accent = accents.find((a) => a.key === config.accent);
    const props = [
      "--primary",
      "--primary-foreground",
      "--ring",
      "--sidebar-primary",
      "--sidebar-ring",
    ];
    if (accent?.primary) {
      root.style.setProperty("--primary", accent.primary);
      root.style.setProperty("--primary-foreground", accent.fg);
      root.style.setProperty("--ring", accent.primary);
      root.style.setProperty("--sidebar-primary", accent.primary);
      root.style.setProperty("--sidebar-ring", accent.primary);
    } else {
      props.forEach((p) => root.style.removeProperty(p));
    }

    root.style.setProperty("--radius", `${config.radius}rem`);

    const font = fonts.find((f) => f.key === config.font);
    if (font?.stack) root.style.setProperty("--font-sans", font.stack);
    else root.style.removeProperty("--font-sans");

    root.dataset.content = config.contentLayout;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // تجاهل
    }
  }, [config]);

  const reset = React.useCallback(() => setConfig(defaultConfig), []);

  return (
    <ThemeConfigContext.Provider
      value={{ config, setConfig, reset, open, setOpen }}
    >
      {children}
    </ThemeConfigContext.Provider>
  );
}

/** زر عجلة الألوان في الترويسة، بجوار مبدّل المظهر. */
export function CustomizerButton() {
  const { setOpen } = useThemeConfig();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label="تخصيص المظهر"
      onClick={() => setOpen(true)}
    >
      <IconPalette className="size-5" />
    </Button>
  );
}

// ---------------------------------------------------------------------------
// الواجهة
// ---------------------------------------------------------------------------

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}

export function ThemeCustomizer() {
  const { config, setConfig, reset, open, setOpen } = useThemeConfig();
  const { theme, setTheme } = useTheme();

  function copyConfig() {
    const css = buildThemeCss(config);
    navigator.clipboard.writeText(css).then(
      () =>
        toast.success("تم نسخ المظهر", {
          description: "ألصقه داخل ملف globals.css في مشروعك.",
        }),
      () => toast.error("تعذّر النسخ إلى الحافظة")
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="shrink-0 border-b">
          <SheetTitle>تخصيص المظهر</SheetTitle>
          <SheetDescription>
            اضبط المظهر ثم انسخ الإعدادات إلى مشروعك.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-6 p-4">
            <Section label="الوضع">
              <div className="grid grid-cols-3 gap-2">
                <OptionButton active={theme === "light"} onClick={() => setTheme("light")}>
                  <IconSun className="size-4" /> نهاري
                </OptionButton>
                <OptionButton active={theme === "dark"} onClick={() => setTheme("dark")}>
                  <IconMoon className="size-4" /> ليلي
                </OptionButton>
                <OptionButton active={theme === "system"} onClick={() => setTheme("system")}>
                  <IconDeviceDesktop className="size-4" /> تلقائي
                </OptionButton>
              </div>
            </Section>

            <Section label="اللون المميّز">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {accents.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, accent: a.key }))}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                      config.accent === a.key
                        ? "border-primary"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <span
                      className="size-4 shrink-0 rounded-full"
                      style={{ background: a.swatch }}
                    />
                    <span className="truncate">{a.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section label="استدارة الحواف">
              <div className="grid grid-cols-6 gap-2">
                {radii.map((r) => (
                  <OptionButton
                    key={r.value}
                    active={config.radius === r.value}
                    onClick={() => setConfig((c) => ({ ...c, radius: r.value }))}
                  >
                    {r.label}
                  </OptionButton>
                ))}
              </div>
            </Section>

            <Section label="الخط">
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((f) => (
                  <OptionButton
                    key={f.key}
                    active={config.font === f.key}
                    onClick={() => setConfig((c) => ({ ...c, font: f.key }))}
                  >
                    {f.label}
                  </OptionButton>
                ))}
              </div>
            </Section>

            <Separator />

            <Section label="نمط الشريط الجانبي">
              <div className="grid grid-cols-3 gap-2">
                {sidebarVariants.map((v) => (
                  <OptionButton
                    key={v.key}
                    active={config.sidebarVariant === v.key}
                    onClick={() =>
                      setConfig((c) => ({ ...c, sidebarVariant: v.key }))
                    }
                  >
                    {v.label}
                  </OptionButton>
                ))}
              </div>
            </Section>

            <Section label="طيّ الشريط الجانبي">
              <div className="grid grid-cols-2 gap-2">
                {collapsibleModes.map((m) => (
                  <OptionButton
                    key={m.key}
                    active={config.sidebarCollapsible === m.key}
                    onClick={() =>
                      setConfig((c) => ({ ...c, sidebarCollapsible: m.key }))
                    }
                  >
                    {m.label}
                  </OptionButton>
                ))}
              </div>
            </Section>

            <Section label="تخطيط المحتوى">
              <div className="grid grid-cols-2 gap-2">
                {contentLayouts.map((l) => (
                  <OptionButton
                    key={l.key}
                    active={config.contentLayout === l.key}
                    onClick={() =>
                      setConfig((c) => ({ ...c, contentLayout: l.key }))
                    }
                  >
                    {l.label}
                  </OptionButton>
                ))}
              </div>
            </Section>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t p-4">
          <Button variant="outline" className="flex-1" onClick={reset}>
            إعادة الضبط
          </Button>
          <Button className="flex-1" onClick={copyConfig}>
            <IconCopy className="size-4" /> نسخ الإعدادات
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
