import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGate } from "@/components/auth-gate";
import { StoreProvider } from "@/lib/shop/store-context";
import { WorkspaceProvider } from "@/lib/workspace/workspace-context";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGate>
      <WorkspaceProvider>
      <StoreProvider>
        <TooltipProvider delayDuration={0}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <AppHeader />
              <main className="app-main min-w-0 flex-1 p-4 md:p-6">{children}</main>
            </SidebarInset>
            <ThemeCustomizer />
          </SidebarProvider>
        </TooltipProvider>
      </StoreProvider>
      </WorkspaceProvider>
    </AuthGate>
  );
}
