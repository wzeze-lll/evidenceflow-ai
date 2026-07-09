import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Upload,
  FolderOpen,
  MessageSquareText,
  Link2,
  AlertTriangle,
  GitCompare,
  FileText,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const { update } = useSettingsStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    { id: "upload", label: "上传文档", description: "上传新文档到文档库", icon: Upload, action: () => navigate("/documents?upload=1"), category: "文档" },
    { id: "search-docs", label: "搜索文档", description: "在文档库中搜索", icon: Search, action: () => navigate("/documents"), category: "文档" },
    { id: "docs", label: "文档库", description: "浏览所有文档", icon: FolderOpen, action: () => navigate("/documents"), category: "文档" },
    { id: "reader", label: "AI 阅读", description: "与文档进行对话", icon: MessageSquareText, action: () => navigate("/reader"), category: "分析" },
    { id: "evidence", label: "证据链", description: "查看证据关系", icon: Link2, action: () => navigate("/evidence"), category: "分析" },
    { id: "conflicts", label: "冲突雷达", description: "检测文档冲突", icon: AlertTriangle, action: () => navigate("/conflicts"), category: "分析" },
    { id: "consensus", label: "共识地图", description: "查看共识主题", icon: GitCompare, action: () => navigate("/consensus"), category: "分析" },
    { id: "brief", label: "决策简报", description: "生成决策简报", icon: FileText, action: () => navigate("/brief"), category: "分析" },
    { id: "settings", label: "设置", description: "打开设置页面", icon: Settings, action: () => navigate("/settings"), category: "系统" },
    { id: "theme-light", label: "浅色模式", description: "切换到浅色主题", icon: Sun, action: () => update({ theme: "light" }), category: "系统" },
    { id: "theme-dark", label: "深色模式", description: "切换到深色主题", icon: Moon, action: () => update({ theme: "dark" }), category: "系统" },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      setCommandPaletteOpen(false);
    }
  };

  const categories = [...new Set(filtered.map((c) => c.category))];

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setCommandPaletteOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入命令或搜索..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">esc</kbd>
              </div>
              <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                {categories.map((category) => {
                  const items = filtered.filter((c) => c.category === category);
                  if (items.length === 0) return null;
                  return (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{category}</div>
                      {items.map((cmd) => {
                        const globalIdx = filtered.indexOf(cmd);
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => {
                              cmd.action();
                              setCommandPaletteOpen(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-colors",
                              selectedIndex === globalIdx
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <cmd.icon className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div>{cmd.label}</div>
                              <div className="text-xs text-muted-foreground">{cmd.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    未找到匹配命令
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
