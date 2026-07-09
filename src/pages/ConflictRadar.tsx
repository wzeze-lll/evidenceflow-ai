import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  FileText,
  Layers,
  Loader2,
  Database,
  Highlighter,
  Lightbulb,
  ListChecks,
  Trash2,
  Clock,
} from "lucide-react";
import { db } from "@/db/database";
import { getAIProvider } from "@/services/ai/provider";
import type { Document, ConflictItem, ConflictLevel, ConflictType } from "@/types";
import { cn } from "@/lib/utils";

// ---- Helpers ----

const CONFLICT_LEVEL_CONFIG: Record<
  ConflictLevel,
  { label: string; bg: string; text: string; dot: string }
> = {
  high: {
    label: "高",
    bg: "bg-red-100 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
  medium: {
    label: "中",
    bg: "bg-amber-100 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  low: {
    label: "低",
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
};

const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  data: "数据冲突",
  definition: "定义冲突",
  opinion: "观点冲突",
  timeline: "时间线冲突",
  methodology: "方法论冲突",
};

const CONFLICT_TYPE_COLORS: Record<ConflictType, string> = {
  data: "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
  definition: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300",
  opinion: "bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300",
  timeline: "bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300",
  methodology: "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
};

// ---- Conflict Card ----

interface ConflictCardProps {
  conflict: ConflictItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function ConflictCard({ conflict, isExpanded, onToggle }: ConflictCardProps) {
  const levelConfig = CONFLICT_LEVEL_CONFIG[conflict.level];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              levelConfig.bg
            )}
          >
            <AlertTriangle className={cn("w-5 h-5", levelConfig.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground">{conflict.topic}</h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                  levelConfig.bg,
                  levelConfig.text
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", levelConfig.dot)} />
                {levelConfig.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                  CONFLICT_TYPE_COLORS[conflict.type]
                )}
              >
                {CONFLICT_TYPE_LABELS[conflict.type]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {conflict.documents.length} 份文档涉及 —{" "}
              {conflict.aiAnalysis.slice(0, 120)}
              {conflict.aiAnalysis.length > 120 ? "..." : ""}
            </p>
          </div>

          <div className="shrink-0 pt-1">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-border pt-5">
              {/* Documents comparison */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  文档观点
                </h4>
                <div className="grid gap-3">
                  {conflict.documents.map((doc, idx) => (
                    <div
                      key={doc.documentId}
                      className="p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {doc.documentName}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 mb-2">{doc.viewpoint}</p>
                      <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border/50">
                        <Highlighter className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          {doc.evidence}
                          {doc.pageNumber !== undefined && (
                            <span className="ml-2 text-muted-foreground/60">
                              （第 {doc.pageNumber} 页）
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  AI 分析
                </h4>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {conflict.aiAnalysis}
                </p>
              </div>

              {/* Suggested Verification */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ListChecks className="w-3.5 h-3.5" />
                  建议验证步骤
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {conflict.suggestedVerification}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Comparison Matrix ----

interface ComparisonMatrixProps {
  conflicts: ConflictItem[];
  documents: Document[];
}

function ComparisonMatrix({ conflicts, documents }: ComparisonMatrixProps) {
  // Get unique document IDs that appear in at least one conflict
  const involvedDocIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach((c) => c.documents.forEach((d) => ids.add(d.documentId)));
    return ids;
  }, [conflicts]);

  const involvedDocs = documents.filter((d) => involvedDocIds.has(d.id));

  if (involvedDocs.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          对比矩阵
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          行 = 分析主题，列 = 文档，单元格 = 观点
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider sticky left-0 bg-muted/30 z-10 min-w-[160px]">
                主题
              </th>
              {involvedDocs.map((doc) => (
                <th
                  key={doc.id}
                  className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider min-w-[200px]"
                >
                  <span className="block truncate max-w-[180px]" title={doc.fileName}>
                    {doc.fileName}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conflicts.map((conflict, rowIdx) => (
              <tr
                key={conflict.id}
                className={cn(
                  "border-b border-border hover:bg-muted/20 transition-colors",
                  rowIdx % 2 === 0 && "bg-muted/10"
                )}
              >
                <td className="px-4 py-3 sticky left-0 bg-card z-10">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        CONFLICT_LEVEL_CONFIG[conflict.level].dot
                      )}
                    />
                    <span className="font-medium text-foreground">{conflict.topic}</span>
                  </div>
                </td>
                {involvedDocs.map((doc) => {
                  const viewpoint = conflict.documents.find(
                    (d) => d.documentId === doc.id
                  );
                  return (
                    <td key={doc.id} className="px-4 py-3 align-top">
                      {viewpoint ? (
                        <div className="text-xs space-y-1">
                          <p className="text-foreground/80 line-clamp-2">
                            {viewpoint.viewpoint}
                          </p>
                          {viewpoint.pageNumber !== undefined && (
                            <span className="text-muted-foreground/60">
                              p.{viewpoint.pageNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40 italic">
                          未提及
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {conflicts.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          无冲突数据可显示
        </div>
      )}
    </div>
  );
}

// ---- Skeleton Loader ----

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
      {/* Conflict cards */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ---- Main Page ----

type AnalysisPhase = "idle" | "selecting" | "analyzing" | "results" | "no-results" | "error";

// Saved analyses list (similar to DecisionBrief sidebar)
function ConflictHistory({
  onSelect,
  onDelete,
}: {
  onSelect: (conflicts: ConflictItem[]) => void;
  onDelete: (ids: string[]) => void;
}) {
  const [analyses, setAnalyses] = useState<{ topic: string; count: number; ids: string[]; date: string; conflicts: ConflictItem[]; docNames: string[] }[]>([]);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const all = await db.conflicts.toArray();
      // Group by time window (30-min buckets)
      const groups: Record<string, ConflictItem[]> = {};
      for (const c of all) {
        const t = new Date(c.createdAt).getTime();
        const bucket = Math.floor(t / (30 * 60 * 1000)).toString();
        if (!groups[bucket]) groups[bucket] = [];
        groups[bucket].push(c);
      }
      const items = Object.entries(groups)
        .map(([, conflicts]) => ({
          topic: conflicts[0]?.topic || "未知主题",
          count: conflicts.length,
          ids: conflicts.map(c => c.id),
          date: conflicts[0]?.createdAt || "",
          conflicts,
          docNames: [...new Set(conflicts.flatMap(c => c.documents.map(d => d.documentName)))],
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAnalyses(items);
    } catch {
      setAnalyses([]);
    }
  };

  if (analyses.length === 0) return null;

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

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
              onClick={() => onSelect(a.conflicts)}
              className="flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors text-left"
            >
              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-xs">{a.topic}</div>
                <div className="text-xs text-muted-foreground">
                  {fmtDate(a.date)} · {a.count} 个冲突 · {a.docNames.slice(0, 2).join("、")}
                </div>
              </div>
            </button>
            <button
              onClick={async () => {
                await onDelete(a.ids);
                setAnalyses(prev => prev.filter((_, j) => j !== i));
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

export function ConflictRadar() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterLevel, setFilterLevel] = useState<ConflictLevel | "all">("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load all documents on mount
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await db.documents.orderBy("createdAt").toArray();
        setDocuments(docs);
        // Pre-select up to 4 documents if available
        if (docs.length >= 2) {
          setSelectedDocIds(new Set(docs.slice(0, Math.min(4, docs.length)).map((d) => d.id)));
          setPhase("selecting");
        }
      } catch {
        setErrorMsg("加载文档失败。请重试。");
        setPhase("error");
      } finally {
        setLoadingDocs(false);
      }
    };
    loadDocs();
  }, []);

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

  const toggleExpand = useCallback((conflictId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conflictId)) {
        next.delete(conflictId);
      } else {
        next.add(conflictId);
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
    setExpandedIds(new Set());
    setFilterLevel("all");
    setErrorMsg(null);

    try {
      // Simulate analysis delay for UX
      await new Promise((r) => setTimeout(r, 800));

      // Load all conflicts from DB
      const allConflicts = await db.conflicts.toArray();

      // Filter to those involving selected documents
      const matched = allConflicts.filter((c) =>
        c.documents.some((d) => selectedDocIds.has(d.documentId))
      );

      if (matched.length === 0) {
        // No cached conflicts - run AI detection
        const provider = getAIProvider();
        const chunks = await db.chunks.where("documentId").anyOf(Array.from(selectedDocIds)).toArray();
        const docs = await db.documents.bulkGet(Array.from(selectedDocIds));
        const detected = await provider.detectConflicts(Array.from(selectedDocIds), docs.filter(Boolean) as Document[], chunks);
        await db.conflicts.bulkPut(detected);
        if (detected.length === 0) {
          setConflicts([]);
          setPhase("no-results");
        } else {
          setConflicts(detected);
          setPhase("results");
        }
      } else {
        setConflicts(matched);
        setPhase("results");
      }
    } catch {
      setErrorMsg("分析失败。请检查数据库并重试。");
      setPhase("error");
    }
  }, [selectedDocIds]);

  const filteredConflicts = useMemo(() => {
    if (filterLevel === "all") return conflicts;
    return conflicts.filter((c) => c.level === filterLevel);
  }, [conflicts, filterLevel]);

  // Summary stats
  const stats = useMemo(() => {
    const total = conflicts.length;
    const high = conflicts.filter((c) => c.level === "high").length;
    const medium = conflicts.filter((c) => c.level === "medium").length;
    const low = conflicts.filter((c) => c.level === "low").length;
    return { total, high, medium, low };
  }, [conflicts]);

  // ---- Initial document loading ----
  if (loadingDocs) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <SkeletonLoader />
      </div>
    );
  }

  // ---- Error loading docs ----
  if (phase === "error" && documents.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
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
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold mb-2">冲突雷达</h1>
          <p className="text-muted-foreground mb-2">
            检测并对比多份文档中的矛盾观点。
          </p>
          <p className="text-sm text-muted-foreground/70 mb-6">
            上传至少 2 份文档以开始分析。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">冲突雷达</h1>
            <p className="text-sm text-muted-foreground mt-1">
              检测并展示文档间的矛盾观点
            </p>
          </div>
          <div className="flex items-center gap-2">
            {phase === "results" && (
              <button
                onClick={() => setPhase("selecting")}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                重新分析
              </button>
            )}
          </div>
        </div>

        {/* Saved Analyses */}
        <ConflictHistory
          onSelect={(c) => { setConflicts(c); setPhase("results"); }}
          onDelete={async (ids) => { await db.conflicts.bulkDelete(ids); }}
        />

        {/* Document selector + Analyze */}
        {(phase === "idle" || phase === "selecting") && (
          <div className="mb-8">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-1">选择待分析文档</h2>
              <p className="text-sm text-muted-foreground mb-4">
                选择 2–5 份文档进行冲突分析（
                已选 {selectedDocIds.size} 份）
              </p>

              {/* Bulk actions */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={selectAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  全选
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  取消全选
                </button>
              </div>

              {/* Document checkboxes */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
                {documents.map((doc) => {
                  const isSelected = selectedDocIds.has(doc.id);
                  const isDisabled =
                    !isSelected && selectedDocIds.size >= 5;
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
                        <div className="text-xs text-muted-foreground">
                          {doc.pageCount} 页
                        </div>
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
                开始分析
                {selectedDocIds.size < 2 && (
                  <span className="text-xs opacity-70">
                    （最少 2 份文档）
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analyzing state */}
        {phase === "analyzing" && (
          <div className="space-y-6">
            <SkeletonLoader />
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                正在分析 {selectedDocIds.size} 份文档中的冲突...
              </span>
            </div>
          </div>
        )}

        {/* No results */}
        {phase === "no-results" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">未发现冲突</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              所选文档之间似乎保持一致，未检测到矛盾观点。
            </p>
            <button
              onClick={() => setPhase("selecting")}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
            >
              尝试其他文档
            </button>
          </div>
        )}

        {/* Error during analysis */}
        {phase === "error" && documents.length > 0 && (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive/60" />
            <h2 className="text-xl font-bold mb-2">分析错误</h2>
            <p className="text-muted-foreground mb-6">{errorMsg}</p>
            <button
              onClick={() => setPhase("selecting")}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
            >
              返回
            </button>
          </div>
        )}

        {/* Results */}
        {phase === "results" && (
          <>
            {/* Summary cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {[
                {
                  label: "冲突总数",
                  value: stats.total,
                  icon: AlertTriangle,
                  color: "text-foreground",
                },
                {
                  label: "高优先级",
                  value: stats.high,
                  icon: AlertTriangle,
                  color: "text-red-600 dark:text-red-400",
                },
                {
                  label: "中优先级",
                  value: stats.medium,
                  icon: AlertTriangle,
                  color: "text-amber-600 dark:text-amber-400",
                },
                {
                  label: "低优先级",
                  value: stats.low,
                  icon: AlertTriangle,
                  color: "text-blue-600 dark:text-blue-400",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-5 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                    <span className="text-xs text-muted-foreground font-medium">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              ))}
            </motion.div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">
                按级别筛选：
              </span>
              {(["all", "high", "medium", "low"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    filterLevel === level
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {level === "all"
                    ? `全部 (${conflicts.length})`
                    : `${level === "high" ? "高" : level === "medium" ? "中" : "低"} (${conflicts.filter((c) => c.level === level).length})`}
                </button>
              ))}

              {filteredConflicts.length === 0 && filterLevel !== "all" && (
                <span className="text-xs text-muted-foreground ml-2">
                  无匹配冲突
                </span>
              )}
            </div>

            {/* Conflict cards */}
            <div className="space-y-4 mb-8">
              <AnimatePresence mode="popLayout">
                {filteredConflicts.map((conflict) => (
                  <ConflictCard
                    key={conflict.id}
                    conflict={conflict}
                    isExpanded={expandedIds.has(conflict.id)}
                    onToggle={() => toggleExpand(conflict.id)}
                  />
                ))}
              </AnimatePresence>

              {filteredConflicts.length === 0 && filterLevel === "all" && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">无可显示的冲突</p>
                </div>
              )}
            </div>

            {/* Comparison Matrix */}
            {conflicts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <ComparisonMatrix conflicts={filteredConflicts} documents={documents} />
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
