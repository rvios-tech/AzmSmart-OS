// ---------------------------------------------------------------------------
// إعدادات مُخصِّص المظهر — القوالب الجاهزة والدوال المساعدة للوحة التخصيص.
// ---------------------------------------------------------------------------

export type SidebarVariant = "inset" | "sidebar" | "floating";
export type SidebarCollapsible = "icon" | "offcanvas";
export type ContentLayout = "centered" | "full";

export type ThemeConfig = {
  accent: string;
  radius: number;
  font: string;
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  contentLayout: ContentLayout;
};

export const defaultConfig: ThemeConfig = {
  accent: "azm",
  radius: 0.75,
  font: "tajawal",
  sidebarVariant: "floating",
  sidebarCollapsible: "icon",
  contentLayout: "full",
};

export type Accent = {
  key: string;
  label: string;
  swatch: string;
  primary: string | null; // null = استخدام اللون الافتراضي للمظهر
  fg: string;
};

export const accents: Accent[] = [
  { key: "azm", label: "أحمر عزم", swatch: "oklch(0.5293 0.1892 25)", primary: null, fg: "oklch(0.985 0 0)" },
  { key: "blue", label: "أزرق", swatch: "oklch(0.6 0.2 264)", primary: "oklch(0.58 0.22 264)", fg: "oklch(0.985 0 0)" },
  { key: "violet", label: "بنفسجي", swatch: "oklch(0.61 0.22 292)", primary: "oklch(0.61 0.22 292)", fg: "oklch(0.985 0 0)" },
  { key: "green", label: "أخضر", swatch: "oklch(0.62 0.17 152)", primary: "oklch(0.58 0.16 152)", fg: "oklch(0.985 0 0)" },
  { key: "teal", label: "أزرق مخضر", swatch: "oklch(0.64 0.12 195)", primary: "oklch(0.58 0.11 195)", fg: "oklch(0.985 0 0)" },
  { key: "amber", label: "كهرماني", swatch: "oklch(0.77 0.16 70)", primary: "oklch(0.77 0.15 70)", fg: "oklch(0.245 0.03 70)" },
  { key: "orange", label: "برتقالي", swatch: "oklch(0.67 0.2 42)", primary: "oklch(0.64 0.2 42)", fg: "oklch(0.985 0 0)" },
  { key: "rose", label: "وردي", swatch: "oklch(0.64 0.24 16)", primary: "oklch(0.62 0.24 16)", fg: "oklch(0.985 0 0)" },
];

export const radii = [
  { label: "0", value: 0 },
  { label: "0.3", value: 0.3 },
  { label: "0.5", value: 0.5 },
  { label: "0.65", value: 0.65 },
  { label: "0.75", value: 0.75 },
  { label: "1.0", value: 1 },
];

export type FontOption = { key: string; label: string; stack: string | null };

export const fonts: FontOption[] = [
  // `null` يعني الاعتماد على خط الواجهة الافتراضي (تجوّل) المحمّل في التخطيط.
  { key: "tajawal", label: "تجوّل", stack: null },
  {
    key: "system",
    label: "خط النظام",
    stack:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Arabic', Tahoma, Arial, sans-serif",
  },
  {
    key: "naskh",
    label: "نسخ",
    stack:
      "'Noto Naskh Arabic', 'Traditional Arabic', 'Times New Roman', ui-serif, serif",
  },
  {
    key: "kufi",
    label: "كوفي",
    stack: "'Noto Kufi Arabic', 'Segoe UI', ui-sans-serif, sans-serif",
  },
];

export const sidebarVariants: { key: SidebarVariant; label: string }[] = [
  { key: "inset", label: "مُدمج" },
  { key: "sidebar", label: "ملتصق" },
  { key: "floating", label: "عائم" },
];

export const collapsibleModes: { key: SidebarCollapsible; label: string }[] = [
  { key: "icon", label: "أيقونات" },
  { key: "offcanvas", label: "إخفاء كامل" },
];

export const contentLayouts: { key: ContentLayout; label: string }[] = [
  { key: "full", label: "عرض كامل" },
  { key: "centered", label: "توسيط" },
];

/** يبني مقتطف CSS جاهزاً للنسخ يعكس الإعدادات الحالية. */
export function buildThemeCss(config: ThemeConfig): string {
  const accent = accents.find((a) => a.key === config.accent);
  const font = fonts.find((f) => f.key === config.font);
  const lines: string[] = [];
  lines.push("/* مظهر عزم سمارت — مُولَّد من لوحة تخصيص المظهر. */");
  lines.push(":root {");
  lines.push(`  --radius: ${config.radius}rem;`);
  if (accent?.primary) {
    lines.push(`  --primary: ${accent.primary};`);
    lines.push(`  --primary-foreground: ${accent.fg};`);
    lines.push(`  --ring: ${accent.primary};`);
    lines.push(`  --sidebar-primary: ${accent.primary};`);
    lines.push(`  --sidebar-ring: ${accent.primary};`);
  }
  if (font?.stack) {
    lines.push(`  --font-sans: ${font.stack};`);
  }
  lines.push("}");
  lines.push("");
  lines.push(
    `/* <Sidebar variant="${config.sidebarVariant}" collapsible="${config.sidebarCollapsible}" /> */`
  );
  lines.push(`/* تخطيط المحتوى: ${config.contentLayout} */`);
  return lines.join("\n");
}
