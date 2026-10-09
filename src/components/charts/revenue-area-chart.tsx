"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { revenueByMonth } from "@/data";
import { formatCompact, formatCurrency } from "@/lib/format";

const config = {
  revenue: { label: "الإيرادات", color: "var(--chart-1)" },
  profit: { label: "الأرباح", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function RevenueAreaChart() {
  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      {/* المحور الأفقي معكوس والمحور الرأسي على اليمين لتتبع القراءة العربية. */}
      <AreaChart data={revenueByMonth} margin={{ left: 8, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          reversed
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={64}
          tickFormatter={(v) => formatCompact(v)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(v) => formatCurrency(Number(v))}
            />
          }
        />
        <Area
          dataKey="profit"
          type="monotone"
          fill="url(#fillProfit)"
          stroke="var(--chart-2)"
          strokeWidth={2}
          stackId="a"
        />
        <Area
          dataKey="revenue"
          type="monotone"
          fill="url(#fillRevenue)"
          stroke="var(--chart-1)"
          strokeWidth={2}
          stackId="b"
        />
      </AreaChart>
    </ChartContainer>
  );
}
