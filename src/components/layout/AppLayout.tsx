import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { CommandPalette } from "./CommandPalette";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all", !sidebarOpen && "ml-0")}>
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <EvidenceDrawer />
    </div>
  );
}

export function FullPageLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
