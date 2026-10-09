"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { trafficSources } from "@/data";
import { formatCompact, formatNumber } from "@/lib/format";

const config = {
  value: { label: "الزوار" },
  "بحث طبيعي": { label: "بحث طبيعي", color: "var(--chart-1)" },
  "مباشر": { label: "مباشر", color: "var(--chart-2)" },
  "إحالة": { label: "إحالة", color: "var(--chart-3)" },
  "تواصل اجتماعي": { label: "تواصل اجتماعي", color: "var(--chart-4)" },
  "بريد إلكتروني": { label: "بريد إلكتروني", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function TrafficDonutChart() {
  const total = React.useMemo(
    () => trafficSources.reduce((a, b) => a + b.value, 0),
    []
  );

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent
              hideLabel
              formatter={(v, name) => `${name}: ${formatNumber(Number(v))}`}
            />} />
        <Pie
          data={trafficSources}
          dataKey="value"
          nameKey="source"
          innerRadius={60}
          strokeWidth={4}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-2xl font-semibold"
                    >
                      {formatCompact(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      زائر
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
