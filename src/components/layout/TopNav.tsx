import { PanelLeft, Sun, Moon, Monitor } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useEffect } from "react";

export function TopNav() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { settings, update } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [settings.theme]);

  const cycleTheme = () => {
    const next = settings.theme === "light" ? "dark" : settings.theme === "dark" ? "system" : "light";
    update({ theme: next });
  };

  const ThemeIcon = settings.theme === "dark" ? Moon : settings.theme === "light" ? Sun : Monitor;

  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            title="切换侧边栏"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        <span className="text-xs text-muted-foreground font-medium">证流 AI</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          title={`主题：${settings.theme}`}
        >
          <ThemeIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
