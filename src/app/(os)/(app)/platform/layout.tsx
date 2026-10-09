import { PlatformGate } from "@/components/platform-gate";

export default function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PlatformGate>{children}</PlatformGate>;
}
