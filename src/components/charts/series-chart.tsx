"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompact, formatDayMonth } from "@/lib/format";

export interface SeriesDef {
  key: string;
  label: string;
  /** متغيّر لون من الثيم: `var(--chart-1)`… */
  color: string;
}

/**
 * مخطط سلسلة زمنية عام — مساحي أو أعمدة — يستقبل البيانات كخاصية.
 * المحور الأفقي معكوس والعمودي على اليمين لتتبع القراءة العربية (كبقية
 * مخططات النظام). `xKey` تاريخ بصيغة YYYY-MM-DD يُعرض «يوم وشهر».
 */
export function SeriesChart({
  data,
  xKey = "day",
  series,
  type = "area",
  height = 280,
  valueFormatter,
}: {
  data: Array<Record<string, string | number>>;
  xKey?: string;
  series: SeriesDef[];
  type?: "area" | "bar";
  height?: number;
  valueFormatter?: (v: number, key: string) => string;
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  ) satisfies ChartConfig;

  const axes = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey={xKey}
        reversed
        tickLine={false}
        axisLine={false}
        tickMargin={10}
        minTickGap={24}
        tickFormatter={(v) => formatDayMonth(String(v))}
      />
      <YAxis
        orientation="right"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        width={56}
        allowDecimals={false}
        tickFormatter={(v) => formatCompact(Number(v))}
      />
      <ChartTooltip
        cursor={false}
        content={
          <ChartTooltipContent
            indicator="dot"
            labelFormatter={(v) => formatDayMonth(String(v))}
            formatter={(v, name) =>
              valueFormatter ? valueFormatter(Number(v), String(name)) : String(v)
            }
          />
        }
      />
    </>
  );

  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      {type === "bar" ? (
        <BarChart data={data} margin={{ left: 8, right: 4, top: 8 }}>
          {axes}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      ) : (
        <AreaChart data={data} margin={{ left: 8, right: 4, top: 8 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {axes}
          {series.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              type="monotone"
              fill={`url(#fill-${s.key})`}
              stroke={s.color}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      )}
    </ChartContainer>
  );
}
