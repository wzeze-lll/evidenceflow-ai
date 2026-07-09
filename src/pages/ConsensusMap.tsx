import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { GitCompare, CheckCircle2, AlertTriangle, Shield, HelpCircle, Users } from "lucide-react";
import { db } from "@/db/database";
import type { ConsensusTopic, Document } from "@/types";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG = {
  strong: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "强共识", barColor: "#22c55e" },
  moderate: { icon: Shield, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", label: "中等共识", barColor: "#3b82f6" },
  weak: { icon: HelpCircle, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800", label: "弱共识", barColor: "#9ca3af" },
  contested: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", label: "存在争议", barColor: "#f59e0b" },
};

export function ConsensusMap() {
  const [topics, setTopics] = useState<ConsensusTopic[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<ConsensusTopic | null>(null);

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
      if (loadedTopics.length > 0) setSelectedTopic(loadedTopics[0]);
    } catch {
      // silent
    }
    setLoading(false);
  };

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

  if (topics.length === 0) {
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

  // Summary counts
  const summary = {
    strong: topics.filter((t) => t.level === "strong").length,
    moderate: topics.filter((t) => t.level === "moderate").length,
    weak: topics.filter((t) => t.level === "weak").length,
    contested: topics.filter((t) => t.level === "contested").length,
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">共识地图</h1>

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
    </div>
  );
}
