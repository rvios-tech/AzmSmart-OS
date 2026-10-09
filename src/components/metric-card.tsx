import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * بطاقة رقم بسيطة بلا نسبة تغيير — للأرقام الحقيقية المحسوبة من الخادم،
 * حيث لا نصطنع «+12%» لا مصدر لها (`StatCard` الأصلية تتطلب نسبة تغيير).
 */
export function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "warn" | "good";
}) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums",
            tone === "warn" && "text-amber-600 dark:text-amber-400",
            tone === "good" && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
