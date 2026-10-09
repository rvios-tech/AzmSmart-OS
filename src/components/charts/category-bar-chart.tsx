"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { salesByCategory } from "@/data";
import { formatPercent } from "@/lib/format";

const config = {
  value: { label: "الحصة", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function CategoryBarChart() {
  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      {/* الأعمدة تنمو من اليمين إلى اليسار وأسماء الفئات على اليمين. */}
      <BarChart
        data={salesByCategory}
        layout="vertical"
        margin={{ left: 16, right: 8, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          reversed
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          hide
        />
        <YAxis
          type="category"
          dataKey="category"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={96}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent formatter={(v) => formatPercent(Number(v), 0)} />
          }
        />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 0, 0, 4]} />
      </BarChart>
    </ChartContainer>
  );
}
