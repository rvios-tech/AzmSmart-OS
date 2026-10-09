"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCompact, formatNumber } from "@/lib/format";

const config = {
  visitors: { label: "الزوار", color: "var(--chart-1)" },
  pageviews: { label: "مشاهدات الصفحات", color: "var(--chart-2)" },
} satisfies ChartConfig;

// اتجاه واقعي لثلاثين يوماً من الزوار ومشاهدات الصفحات.
const base = [
  2140, 2380, 2210, 2560, 2890, 2470, 2050, 2320, 2680, 2910, 3120, 2870,
  2640, 2980, 3340, 3610, 3280, 2960, 3180, 3520, 3810, 3640, 3290, 3480,
  3760, 4020, 3880, 3560, 3920, 4180,
];

const data = base.map((visitors, i) => ({
  day: `${i + 1}`,
  visitors,
  pageviews: Math.round(visitors * (2.4 + ((i % 5) * 0.06))),
}));

export function AnalyticsLineChart() {
  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      <LineChart data={data} margin={{ left: 8, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          reversed
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          interval={4}
          tickFormatter={(v) => `${v} يونيو`}
        />
        <YAxis
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={52}
          tickFormatter={(v) => formatCompact(v)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(v) => `${v} يونيو`}
              formatter={(v) => formatNumber(Number(v))}
            />
          }
        />
        <Line
          dataKey="pageviews"
          type="monotone"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="visitors"
          type="monotone"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
