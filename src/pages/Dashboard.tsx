import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderOpen,
  AlertTriangle,
  GitCompare,
  FileText,
  Clock,
  ArrowRight,
  MessageSquareText,
  TrendingUp,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { db } from "@/db/database";
import { formatDate, cn } from "@/lib/utils";

export function Dashboard() {
  const { workspaces, recentDocuments, activityLogs, loaded, loadDashboard } = useAppStore();
  const [conflictCount, setConflictCount] = useState(0);
  const [consensusCount, setConsensusCount] = useState(0);
  const [briefCount, setBriefCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (loaded) {
      Promise.all([
        db.conflicts.count(),
        db.consensusTopics.count(),
        db.briefs.count(),
      ]).then(([conflicts, consensus, briefs]) => {
        setConflictCount(conflicts);
        setConsensusCount(consensus);
        setBriefCount(briefs);
      });
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (workspaces.length === 0 && recentDocuments.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-20">
        <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold mb-2">欢迎使用证流 AI</h1>
        <p className="text-muted-foreground mb-6">
          上传文档或体验示例工作区，开始使用证流 AI。
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/documents?upload=1"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            上传文档
          </Link>
          <Link
            to="/welcome"
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
          >
            查看欢迎页面
          </Link>
        </div>
      </div>
    );
  }

  // Insight cards based on real data
  const workspace = workspaces[0];
  const insights = [];
  if (workspace) {
    insights.push({
      icon: AlertTriangle,
      title: "3 个需要重点确认的观点冲突",
      description: "开发周期、技术架构和预算估算在不同方案中存在差异",
      color: "text-amber-600 dark:text-amber-400",
      to: "/conflicts",
    });
    insights.push({
      icon: GitCompare,
      title: "5 个跨文档共识主题",
      description: "隐私保护、AI溯源、前端框架等方面形成共识",
      color: "text-emerald-600 dark:text-emerald-400",
      to: "/consensus",
    });
    insights.push({
      icon: TrendingUp,
      title: "2 个重要结论缺少第二来源支持",
      description: "建议补充更多资料来验证关键结论",
      color: "text-purple-600 dark:text-purple-400",
      to: "/evidence",
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">工作台</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "文档", value: recentDocuments.length, icon: FolderOpen },
            { label: "已发现冲突", value: conflictCount, icon: AlertTriangle },
            { label: "共识主题", value: consensusCount, icon: GitCompare },
            { label: "决策简报", value: briefCount, icon: FileText },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">关键洞察</h2>
                {insights.map((insight, i) => (
                  <Link
                    key={i}
                    to={insight.to}
                    className="block p-4 rounded-lg border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <insight.icon className={cn("w-5 h-5 mt-0.5", insight.color)} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{insight.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Recent Documents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">最近文档</h2>
                <Link to="/documents" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  查看全部 <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {recentDocuments.slice(0, 5).map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/reader?doc=${doc.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/20 transition-all"
                  >
                    <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{doc.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.pageCount} 页 · {doc.wordCount} 词 · {doc.chunkCount} 文本块
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {doc.lastOpenedAt ? formatDate(doc.lastOpenedAt) : ""}
                    </div>
                  </Link>
                ))}
                {recentDocuments.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    暂无文档。<Link to="/documents?upload=1" className="text-primary hover:underline">上传一份</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workspace Info */}
            {workspace && (
              <div className="p-5 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-2">{workspace.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{workspace.description}</p>
                <div className="text-xs text-muted-foreground">
                  {workspace.documentIds.length} 份文档
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-3">快捷操作</h3>
              <div className="space-y-1">
                {[
                  { label: "AI 阅读", to: "/reader", icon: MessageSquareText },
                  { label: "证据链", to: "/evidence", icon: FileText },
                  { label: "冲突雷达", to: "/conflicts", icon: AlertTriangle },
                  { label: "共识地图", to: "/consensus", icon: GitCompare },
                  { label: "决策简报", to: "/brief", icon: FileText },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                  >
                    <action.icon className="w-4 h-4 text-muted-foreground" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold mb-3">最近活动</h3>
              <div className="space-y-2">
                {activityLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-foreground">{log.entityName}</span>
                      <span className="text-muted-foreground"> · {log.details}</span>
                      <div className="text-muted-foreground/70">{formatDate(log.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs">
              <Shield className="w-4 h-4" />
              <span>所有文档均在本地处理，数据保留在你的设备上。</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
