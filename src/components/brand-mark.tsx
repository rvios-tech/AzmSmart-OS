import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * شعار عزم سمارت — العلامة بالكريمي فوق الأحمر، كأيقونة النظام (`app/icon.svg`).
 *
 * مصدر واحد لكل ظهور للعلامة (الدخول، الصيانة، قريباً، الشريط الجانبي)
 * بدل نسخ الصندوق ذاته في كل صفحة.
 */
export function BrandMark({
  size = 8,
  className,
}: {
  /** حجم الصندوق بوحدات Tailwind (`size-{n}`) — الأيقونة تُقاس نسبةً منه. */
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-primary p-1",
        className,
      )}
      style={{ width: `calc(var(--spacing) * ${size})`, height: `calc(var(--spacing) * ${size})` }}
    >
      <Image
        src="/brand/azmsmart-mark-light.svg"
        alt="عزم سمارت"
        width={40}
        height={40}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  );
}
