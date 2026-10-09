"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCompact, formatCurrency } from "@/lib/format";

const config = {
  value: { label: "المحفظة", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function CryptoPortfolioChart({
  data,
}: {
  data: { t: string; value: number }[];
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <AreaChart data={data} margin={{ left: 8, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="fillPortfolio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          reversed
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={28}
          interval="preserveStartEnd"
        />
        <YAxis
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={72}
          domain={["dataMin - 4000", "dataMax + 2000"]}
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
          dataKey="value"
          type="monotone"
          fill="url(#fillPortfolio)"
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
