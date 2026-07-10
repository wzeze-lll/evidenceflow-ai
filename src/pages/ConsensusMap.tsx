import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { GitCompare, CheckCircle2, AlertTriangle, Shield, HelpCircle, Users, CheckSquare, Square, Search, Loader2, Trash2, Clock } from "lucide-react";
import { db } from "@/db/database";
import { getAIProvider } from "@/services/ai/provider";
import type { ConsensusTopic, Document } from "@/types";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG = {
  strong: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "强共识", barColor: "#22c55e" },
  moderate: { icon: Shield, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", label: "中等共识", barColor: "#3b82f6" },
  weak: { icon: HelpCircle, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800", label: "弱共识", barColor: "#9ca3af" },
  contested: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", label: "存在争议", barColor: "#f59e0b" },
};

type AnalysisPhase = "idle" | "selecting" | "analyzing" | "results" | "no-results" | "error";

function ConsensusHistory({
  onSelect,
  onDelete,
}: {
  onSelect: (topics: ConsensusTopic[]) => void;
  onDelete: (ids: string[]) => void;
}) {
  const [analyses, setAnalyses] = useState<{ topic: string; count: number; ids: string[]; date: string; topics: ConsensusTopic[]; docNames: string[] }[]>([]);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const all = await db.consensusTopics.toArray();
      const groups: Record<string, ConsensusTopic[]> = {};
      for (const t of all) {
        const groupsList = Object.keys(groups);
        const existing = groupsList.find((k) => k === t.topic);
        if (existing) {
          groups[existing].push(t);
        } else {
          groups[t.topic] = [t];
        }
      }
      const items = Object.entries(groups)
        .map(([, topics]) => ({
          topic: topics[0]?.topic || "未知主题",
          count: topics.length,
          ids: topics.map((t) => t.id),
          date: new Date().toISOString(),
          topics,
          docNames: [...new Set(topics.flatMap((t) => [...t.supportingDocuments.map((s) => s.documentName), ...t.opposingDocuments.map((o) => o.documentName)]))],
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAnalyses(items);
    } catch {
      setAnalyses([]);
    }
  };

  if (analyses.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">历史分析记录</h3>
        <span className="text-xs text-muted-foreground">{analyses.length} 条</span>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {analyses.map((a, i) => (
          <div key={i} className="flex items-center group">
            <button
              onClick={() => onSelect(a.topics)}
              className="flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors text-left"
            >
              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-xs">{a.topic}</div>
                <div className="text-xs text-muted-foreground">
                  {a.count} 个主题 · {a.docNames.slice(0, 2).join("、")}
                </div>
              </div>
            </button>
            <button
              onClick={async () => {
                await onDelete(a.ids);
                setAnalyses((prev) => prev.filter((_, j) => j !== i));
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive shrink-0"
              title="删除"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConsensusMap() {
  const [topics, setTopics] = useState<ConsensusTopic[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<ConsensusTopic | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedTopics, loadedDocs] = await Promise.all([
        db.consensusTopics.toArray(),
        db.documents.toArray(),
      ]);
      setTopics(loadedTopics);
      setDocuments(loadedDocs);
      if (loadedTopics.length > 0) {
        setSelectedTopic(loadedTopics[0]);
        setPhase("results");
      } else if (loadedDocs.length >= 2) {
        setSelectedDocIds(new Set(loadedDocs.slice(0, Math.min(4, loadedDocs.length)).map((d) => d.id)));
        setPhase("selecting");
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  const toggleDocument = useCallback((docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedDocIds(new Set(documents.map((d) => d.id)));
  }, [documents]);

  const clearSelection = useCallback(() => {
    setSelectedDocIds(new Set());
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (selectedDocIds.size < 2) return;

    setPhase("analyzing");
    setErrorMsg(null);

    try {
      const provider = getAIProvider();
      const selectedIds = Array.from(selectedDocIds);
      const chunks = await db.chunks.where("documentId").anyOf(selectedIds).toArray();
      const docs = await db.documents.bulkGet(selectedIds);
      const generated = await provider.generateConsensusTopics(selectedIds, docs.filter(Boolean) as Document[], chunks);

      if (generated.length === 0) {
        setTopics([]);
        setPhase("no-results");
      } else {
        await db.consensusTopics.bulkPut(generated);
        setTopics(generated);
        setSelectedTopic(generated[0]);
        setPhase("results");
      }
    } catch {
      setErrorMsg("分析失败。请检查数据库并重试。");
      setPhase("error");
    }
  }, [selectedDocIds]);

  // Prepare chart data
  const chartData = topics.map((t) => ({
    name: t.topic.length > 20 ? t.topic.slice(0, 20) + "..." : t.topic,
    fullName: t.topic,
    coverage: t.coveragePercentage,
    supporting: t.supportingDocuments.length,
    opposing: t.opposingDocuments.length,
    level: t.level,
  }));

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- Error loading docs ----
  if (phase === "error" && documents.length === 0) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive/60" />
          <h1 className="text-xl font-bold mb-2">加载失败</h1>
          <p className="text-muted-foreground mb-4">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // ---- No documents at all ----
  if (documents.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-20">
        <GitCompare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold mb-2">共识地图</h1>
        <p className="text-muted-foreground mb-4">
          上传多份相关文档，使用 AI 阅读来发现共识和分歧。
        </p>
        <Link to="/reader" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
          前往 AI 阅读 →
        </Link>
      </div>
    );
  }

  // ---- Show document selector when no results yet ----
  if (topics.length === 0 && phase !== "analyzing" && phase !== "no-results") {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">共识地图</h1>
              <p className="text-sm text-muted-foreground mt-1">
                发现文档间的共识与分歧
              </p>
            </div>
          </div>

          {/* Document selector */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-1">选择待分析文档</h2>
            <p className="text-sm text-muted-foreground mb-4">
              选择 2–5 份文档进行共识分析（已选 {selectedDocIds.size} 份）
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button onClick={selectAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                全选
              </button>
              <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                取消全选
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
              {documents.map((doc) => {
                const isSelected = selectedDocIds.has(doc.id);
                const isDisabled = !isSelected && selectedDocIds.size >= 5;
                return (
                  <button
                    key={doc.id}
                    disabled={isDisabled}
                    onClick={() => toggleDocument(doc.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/20 hover:bg-muted/30",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{doc.fileName}</div>
                      <div className="text-xs text-muted-foreground">{doc.pageCount} 页</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={selectedDocIds.size < 2}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all",
                selectedDocIds.size >= 2
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Search className="w-4 h-4" />
              生成共识分析
              {selectedDocIds.size < 2 && (
                <span className="text-xs opacity-70">（最少 2 份文档）</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Analyzing state ----
  if (phase === "analyzing") {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            正在分析 {selectedDocIds.size} 份文档的共识...
          </span>
        </div>
      </div>
    );
  }

  // ---- No results ----
  if (phase === "no-results") {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">未发现共识主题</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            所选文档之间似乎没有明确的共识主题，可能文档内容差异较大。
          </p>
          <button
            onClick={() => setPhase("selecting")}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
          >
            尝试其他文档
          </button>
        </div>
      </div>
    );
  }

  // Summary counts
  const summary = {
    strong: topics.filter((t) => t.level === "strong").length,
    moderate: topics.filter((t) => t.level === "moderate").length,
    weak: topics.filter((t) => t.level === "weak").length,
    contested: topics.filter((t) => t.level === "contested").length,
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">共识地图</h1>
            <p className="text-sm text-muted-foreground mt-1">
              发现文档间的共识与分歧
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPhase("selecting")}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              重新分析
            </button>
          </div>
        </div>

        {/* Saved Analyses */}
        <ConsensusHistory
          onSelect={(t) => { setTopics(t); setSelectedTopic(t[0] || null); setPhase("results"); }}
          onDelete={async (ids) => { await db.consensusTopics.bulkDelete(ids); }}
        />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(summary).map(([key, count]) => {
          const config = LEVEL_CONFIG[key as keyof typeof LEVEL_CONFIG];
          const Icon = config.icon;
          return (
            <div key={key} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", config.color)} />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Chart & Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coverage Chart */}
          {chartData.length > 0 && (
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-4">各主题文档覆盖率</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [`${value}%`, "覆盖率"]}
                    labelFormatter={(label: any) => chartData.find((d) => d.name === label)?.fullName || label}
                  />
                  <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={LEVEL_CONFIG[entry.level as keyof typeof LEVEL_CONFIG]?.barColor || "#9ca3af"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Document-Topic Matrix */}
          <div className="p-6 rounded-xl border border-border bg-card overflow-x-auto">
            <h3 className="font-semibold mb-4">文档 × 主题矩阵</h3>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">主题</th>
                  {documents.map((doc) => (
                    <th key={doc.id} className="text-center px-3 py-2 text-muted-foreground font-medium text-xs max-w-[120px]">
                      <div className="truncate">{doc.fileName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id} className="border-t border-border">
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => setSelectedTopic(topic)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        <div className="font-medium text-xs">{topic.topic}</div>
                        <div className={cn("text-xs mt-0.5", LEVEL_CONFIG[topic.level].color)}>
                          {LEVEL_CONFIG[topic.level].label}
                        </div>
                      </button>
                    </td>
                    {documents.map((doc) => {
                      const isSupporting = topic.supportingDocuments.some((s) => s.documentId === doc.id);
                      const isOpposing = topic.opposingDocuments.some((o) => o.documentId === doc.id);
                      return (
                        <td key={doc.id} className="text-center px-3 py-3">
                          {isSupporting ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : isOpposing ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 支持</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> 反对</span>
              <span className="flex items-center gap-1">— 未提及</span>
            </div>
          </div>
        </div>

        {/* Right: Topic Details */}
        <div className="space-y-6">
          {/* Topic List */}
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {topics.map((topic) => {
              const config = LEVEL_CONFIG[topic.level];
              const Icon = config.icon;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    "w-full text-left p-4 transition-colors",
                    selectedTopic?.id === topic.id
                      ? "bg-accent"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm font-medium">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {topic.supportingDocuments.length} 份文档
                    </span>
                    <span>{topic.coveragePercentage}% 覆盖率</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Topic Detail */}
          {selectedTopic && (
            <motion.div
              key={selectedTopic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const config = LEVEL_CONFIG[selectedTopic.level];
                  const Icon = config.icon;
                  return <Icon className={cn("w-5 h-5", config.color)} />;
                })()}
                <h3 className="font-semibold">{selectedTopic.topic}</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{selectedTopic.description}</p>

              {/* Coverage Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">文档覆盖率</span>
                  <span className="font-medium">{selectedTopic.coveragePercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${selectedTopic.coveragePercentage}%`,
                      backgroundColor: LEVEL_CONFIG[selectedTopic.level].barColor,
                    }}
                  />
                </div>
              </div>

              {/* Supporting Documents */}
              {selectedTopic.supportingDocuments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    支持文档 ({selectedTopic.supportingDocuments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTopic.supportingDocuments.map((sd, i) => (
                      <div key={i} className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-sm">
                        <div className="font-medium text-xs">{sd.documentName}</div>
                        <p className="text-xs text-muted-foreground mt-1">"{sd.excerpt.slice(0, 150)}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opposing Documents */}
              {selectedTopic.opposingDocuments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                    反对文档 ({selectedTopic.opposingDocuments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTopic.opposingDocuments.map((od, i) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-sm">
                        <div className="font-medium text-xs">{od.documentName}</div>
                        <p className="text-xs text-muted-foreground mt-1">"{od.excerpt.slice(0, 150)}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      </motion.div>
    </div>
  );
}
