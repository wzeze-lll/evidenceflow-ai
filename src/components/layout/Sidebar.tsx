import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquareText,
  Link2,
  AlertTriangle,
  GitCompare,
  FileText,
  Settings,
  ChevronLeft,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "工作台" },
  { to: "/documents", icon: FolderOpen, label: "文档库" },
  { to: "/reader", icon: MessageSquareText, label: "AI 阅读" },
  { to: "/evidence", icon: Link2, label: "证据链" },
  { to: "/conflicts", icon: AlertTriangle, label: "冲突雷达" },
  { to: "/consensus", icon: GitCompare, label: "共识地图" },
  { to: "/brief", icon: FileText, label: "决策简报" },
] as const;

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  return (
    <AnimatePresence initial={false}>
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-screen bg-sidebar border-r border-border flex flex-col shrink-0 overflow-hidden"
        >
          {/* Logo */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-border">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">证</span>
              </div>
              <span className="font-semibold text-sm">证流 AI</span>
            </NavLink>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-sidebar-hover text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-3 space-y-1">
            <button
              onClick={() => useAppStore.getState().setCommandPaletteOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-sidebar-hover transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>搜索或执行命令...</span>
              <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded bg-sidebar-active text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <NavLink
              to="/documents?upload=1"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>上传文档</span>
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-active text-sidebar-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Settings at Bottom */}
          <div className="p-2 border-t border-border">
            <NavLink
              to="/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname === "/settings"
                  ? "bg-sidebar-active text-sidebar-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground"
              )}
            >
              <Settings className="w-4 h-4" />
              <span>设置</span>
            </NavLink>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
      <div className="absolute left-0 top-0 h-full w-64 bg-sidebar">
        <Sidebar />
      </div>
    </div>
  );
}
