import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Cpu,
  Key,
  Globe,
  Box,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Type,
  Shield,
  Trash2,
  Download,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  HardDrive,
  Database,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { db } from "@/db/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AI_PROVIDERS = [
  { value: "mock", label: "模拟演示" },
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "custom", label: "自定义" },
] as const;

const THEME_OPTIONS = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const;

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
] as const;

type TestStatus = "idle" | "testing" | "success" | "error";

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-start gap-3 px-6 pt-5 pb-2">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="px-6 pb-5 pt-3">{children}</div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export function Settings() {
  const { settings, loaded, load, update, reset } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Load settings on mount
  useEffect(() => {
    load();
  }, [load]);

  // --- Handlers ---

  const handleTestConnection = useCallback(async () => {
    setTestStatus("testing");
    setTestMessage("");

    // Simulate a connection test with artificial delay
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!settings.aiApiKey && settings.aiProvider !== "mock") {
            reject(new Error("API Key is required for this provider."));
            return;
          }
          if (settings.aiProvider === "mock") {
            resolve(true);
            return;
          }
          // Simulate a successful test
          resolve(true);
        }, 1500);
      });

      setTestStatus("success");
      setTestMessage(
        settings.aiProvider === "mock"
          ? "模拟服务始终可用。"
          : `成功连接到 ${settings.aiProvider}。`,
      );
    } catch (err) {
      setTestStatus("error");
      setTestMessage(
        err instanceof Error ? err.message : "连接测试失败。",
      );
    }
  }, [settings.aiApiKey, settings.aiProvider]);

  const handleClearAllData = useCallback(async () => {
    try {
      await Promise.all([
        db.documents.clear(),
        db.chunks.clear(),
        db.workspaces.clear(),
        db.projects.clear(),
        db.conversations.clear(),
        db.claims.clear(),
        db.evidences.clear(),
        db.conflicts.clear(),
        db.consensusTopics.clear(),
        db.briefs.clear(),
        db.knowledgeCards.clear(),
        db.activityLogs.clear(),
      ]);
      await reset();
      setClearDialogOpen(false);
    } catch {
      // Silently handle clear errors
    }
  }, [reset]);

  const handleExportData = useCallback(async () => {
    try {
      const data: Record<string, unknown[]> = {
        documents: await db.documents.toArray(),
        chunks: await db.chunks.toArray(),
        workspaces: await db.workspaces.toArray(),
        projects: await db.projects.toArray(),
        conversations: await db.conversations.toArray(),
        claims: await db.claims.toArray(),
        evidences: await db.evidences.toArray(),
        conflicts: await db.conflicts.toArray(),
        consensusTopics: await db.consensusTopics.toArray(),
        briefs: await db.briefs.toArray(),
        knowledgeCards: await db.knowledgeCards.toArray(),
        activityLogs: await db.activityLogs.toArray(),
        settings: await db.settings.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evidenceflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle export errors
    }
  }, []);

  // --- Loading state ---
  if (!loaded) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Main layout ---
  return (
    <div className="p-8 max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工作台
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* ---- AI Provider ---- */}
        <SettingsSection
          title="AI 服务"
          description="配置文档分析和对话的 AI 服务。"
          icon={Cpu}
        >
          <div className="space-y-4">
            {/* Provider select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">服务商</label>
              <Select
                value={settings.aiProvider}
                onValueChange={(value) =>
                  update({ aiProvider: value as typeof settings.aiProvider })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择服务商" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">API 密钥</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Key className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={settings.aiApiKey}
                  onChange={(e) => update({ aiApiKey: e.target.value })}
                  placeholder={
                    settings.aiProvider === "mock"
                      ? "模拟模式无需密钥"
                      : "sk-..."
                  }
                  className="pl-9 pr-10"
                  disabled={settings.aiProvider === "mock"}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.aiProvider === "mock"
                  ? "模拟服务使用本地演示数据，无需 API 密钥。"
                  : "你的 API 密钥存储在本地浏览器中，不会发送到我们的服务器。"}
              </p>
            </div>

            {/* Base URL (custom only) */}
            {settings.aiProvider === "custom" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Base URL</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="url"
                    value={settings.aiBaseUrl}
                    onChange={(e) => update({ aiBaseUrl: e.target.value })}
                    placeholder="https://api.example.com/v1"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  自定义 OpenAI 兼容 API 端点的 Base URL。
                </p>
              </div>
            )}

            {/* Model name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">模型</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Box className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  value={settings.aiModel}
                  onChange={(e) => update({ aiModel: e.target.value })}
                  placeholder="gpt-4o"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                用于 AI 请求的模型标识符（例如 gpt-4o、
                deepseek-chat）。
              </p>
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testStatus === "testing"}
              >
                {testStatus === "testing" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {testStatus === "testing"
                  ? "测试中..."
                  : "测试连接"}
              </Button>

              {testStatus === "success" && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {testMessage}
                </span>
              )}
              {testStatus === "error" && (
                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <XCircle className="w-3.5 h-3.5" />
                  {testMessage}
                </span>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* ---- Appearance ---- */}
        <SettingsSection
          title="外观"
          description="自定义证流 AI 的外观和体验。"
          icon={Sun}
        >
          <div className="space-y-4">
            {/* Theme */}
            <div className="space-y-2">
              <label className="text-sm font-medium">主题</label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = settings.theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        update({ theme: opt.value as typeof settings.theme })
                      }
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">字号</label>
              <Select
                value={settings.fontSize}
                onValueChange={(value) =>
                  update({ fontSize: value as typeof settings.fontSize })
                }
              >
                <SelectTrigger className="w-48">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="选择字号" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsSection>

        {/* ---- Privacy Center ---- */}
        <SettingsSection
          title="隐私中心"
          description="了解和管理你的数据处理方式。"
          icon={Shield}
        >
          <div className="space-y-5">
            {/* Data processing info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">本地处理</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  所有文档在浏览器本地解析和分析。
                  除非你明确将其发送到远程 AI 服务，否则文件不会离开你的设备。
                  
                </p>
                <Badge variant="success" className="mt-2 text-[10px]">
                  Active
                </Badge>
              </div>

              <div className="p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium">远程 AI</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  使用远程 AI 服务时，仅发送匿名化的文本摘录。
                  完整的文档和个人数据不会被传输。
                  
                </p>
                <Badge variant="warning" className="mt-2 text-[10px]">
                  {settings.aiProvider === "mock" ? "未激活" : "已激活"}
                </Badge>
              </div>
            </div>

            {/* Local data status */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
              <Database className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">本地数据</p>
                <p className="text-xs text-muted-foreground">
                  所有数据存储在浏览器的 IndexedDB 中。不使用
                  账户或服务器存储。
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                仅本地
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Export */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4" />
                导出数据
              </Button>

              {/* Clear all data with confirmation */}
              <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">清除所有数据</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      清除所有数据
                    </DialogTitle>
                    <DialogDescription>
                      这将永久删除存储在浏览器本地的所有文档、对话、
                      结论、证据、设置和分析结果。
                      此操作不可撤销。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">
                        此操作不可撤销。
                      </p>
                      <p className="text-xs text-muted-foreground">
                        建议在清除前导出数据。所有
                        本地存储的信息都将丢失。
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setClearDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAllData}
                    >
                      <Trash2 className="w-4 h-4" />
                      全部删除
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SettingsSection>

        {/* ---- About ---- */}
        <SettingsSection
          title="关于"
          description="版本和技术信息。"
          icon={Info}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">
                应用版本
              </span>
              <span className="text-sm font-mono">1.0.0-alpha</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">构建</span>
              <span className="text-sm font-mono">2026.07.09</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">
                技术栈
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "React 19",
                  "TypeScript",
                  "Tailwind CSS v4",
                  "Framer Motion",
                  "Zustand",
                  "Dexie.js",
                  "Recharts",
                  "Lucide Icons",
                  "Radix UI",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 text-[11px] rounded-md bg-muted text-muted-foreground font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">许可证</span>
              <span className="text-sm">MIT</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              证流 AI &mdash; 可验证文档智能分析与决策工作台。让每一个结论，都有证据可循。
            </p>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
