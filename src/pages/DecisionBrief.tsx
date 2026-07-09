import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Plus,
} from "lucide-react";
import { db } from "@/db/database";
import { getAIProvider } from "@/services/ai/provider";
import { useAppStore } from "@/stores/app-store";
import type { DecisionBrief, Document, DocumentChunk } from "@/types";
import { cn, formatDate, generateId } from "@/lib/utils";
import { getRelationColor, getRelationLabel } from "@/services/citation/citation-mapper";

export function DecisionBrief() {
  const [briefs, setBriefs] = useState<DecisionBrief[]>([]);
  const [activeBrief, setActiveBrief] = useState<DecisionBrief | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { openEvidenceDrawer } = useAppStore();

  const [formData, setFormData] = useState({
    title: "",
    target: "project_evaluation" as string,
    audience: "team" as string,
    detail: "standard" as string,
    documentIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedBriefs, loadedDocs] = await Promise.all([
      db.briefs.orderBy("createdAt").reverse().toArray(),
      db.documents.toArray(),
    ]);
    setBriefs(loadedBriefs);
    setDocuments(loadedDocs);
    if (loadedBriefs.length > 0) setActiveBrief(loadedBriefs[0]);
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      setError("请输入简报标题。");
      return;
    }
    if (formData.documentIds.length === 0) {
      setError("请至少选择一份文档。");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const selectedDocs = documents.filter((d) => formData.documentIds.includes(d.id));
      // Collect chunks from ALL selected documents
      const chunks: DocumentChunk[] = [];
      for (const docId of formData.documentIds) {
        const chs = await db.chunks.where("documentId").equals(docId).toArray();
        chunks.push(...chs);
      }

      const provider = getAIProvider();
      const brief = await provider.generateDecisionBrief(
        {
          projectId: generateId(),
          title: formData.title,
          target: formData.target,
          audience: formData.audience,
          detail: formData.detail,
        },
        selectedDocs,
        chunks
      );

      // Save to DB
      await db.briefs.put(brief);
      await db.activityLogs.put({
        id: `log-${Date.now()}`,
        action: "decision_brief",
        entityType: "brief",
        entityId: brief.id,
        entityName: brief.title,
        timestamp: new Date().toISOString(),
        details: `从 ${selectedDocs.length} 份文档生成决策简报`,
      });

      setBriefs((prev) => [brief, ...prev]);
      setActiveBrief(brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成简报失败");
    }
    setGenerating(false);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (format: "md" | "txt") => {
    if (!activeBrief) return;
    let content = `# ${activeBrief.title}\n\n`;
    content += `生成时间：${formatDate(activeBrief.createdAt)}\n`;
    content += `目标：${activeBrief.target} | 受众：${activeBrief.audience} | 详细程度：${activeBrief.detail}\n\n---\n\n`;
    for (const section of activeBrief.sections.sort((a, b) => a.order - b.order)) {
      content += `## ${section.title}\n\n${section.content}\n\n`;
      if (section.citations.length > 0) {
        content += `*来源：*\n`;
        section.citations.forEach((c) => {
          content += `- ${c.documentName}，第 ${c.pageNumber || "无"} 页："${c.text.slice(0, 100)}..."\n`;
        });
        content += "\n";
      }
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeBrief.title.replace(/\s+/g, "_")}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const targetLabels: Record<string, string> = {
    project_evaluation: "项目评估",
    study_summary: "学习总结",
    requirement_review: "需求评审",
    report_comparison: "报告对比",
    research_analysis: "研究分析",
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">决策简报</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Brief list & generation form */}
        <div className="space-y-6">
          {/* Generation Form */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-semibold mb-4">生成新简报</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">简报标题</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="例如：技术方案对比"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">简报目标</label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData((p) => ({ ...p, target: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none"
                >
                  {Object.entries(targetLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">文档</label>
                <div className="max-h-32 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {documents.map((doc) => (
                    <label key={doc.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.documentIds.includes(doc.id)}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            documentIds: e.target.checked
                              ? [...p.documentIds, doc.id]
                              : p.documentIds.filter((id) => id !== doc.id),
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="truncate">{doc.fileName}</span>
                    </label>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2">暂无可用文档</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    生成简报
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Saved Briefs */}
          <div>
            <h3 className="text-sm font-semibold mb-2">已保存简报（{briefs.length}）</h3>
            <div className="space-y-1">
              {briefs.map((brief) => (
                <button
                  key={brief.id}
                  onClick={() => setActiveBrief(brief)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    activeBrief?.id === brief.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <div className="truncate">{brief.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(brief.createdAt)}</div>
                </button>
              ))}
              {briefs.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">尚未生成简报</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Brief Content */}
        <div className="lg:col-span-2">
          {activeBrief ? (
            <motion.div
              key={activeBrief.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Brief Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{activeBrief.title}</h2>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{targetLabels[activeBrief.target] || activeBrief.target}</span>
                      <span>·</span>
                      <span>受众：{activeBrief.audience}</span>
                      <span>·</span>
                      <span>{formatDate(activeBrief.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(activeBrief.sections.map((s) => s.content).join("\n\n"), "brief")}
                      className="p-2 rounded-md hover:bg-muted text-muted-foreground"
                      title="复制内容"
                    >
                      {copiedId === "brief" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleExport("md")}
                      className="p-2 rounded-md hover:bg-muted text-muted-foreground"
                      title="导出 Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="divide-y divide-border">
                {activeBrief.sections.sort((a, b) => a.order - b.order).map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors text-left"
                    >
                      <h3 className="font-semibold text-sm">{section.title}</h3>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    {expandedSections.has(section.id) && (
                      <div className="px-6 pb-4">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                          {section.content}
                        </div>

                        {/* Section Citations */}
                        {section.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border">
                            <div className="text-xs font-medium text-muted-foreground mb-2">来源：</div>
                            <div className="space-y-1.5">
                              {section.citations.map((cite, idx) => (
                                <button
                                  key={cite.id}
                                  onClick={() => openEvidenceDrawer({ evidenceId: cite.id })}
                                  className="w-full text-left flex items-start gap-2 p-2 rounded-md hover:bg-muted transition-colors group"
                                >
                                  <span className="shrink-0 w-5 h-5 rounded bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium truncate">{cite.documentName}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      第 {cite.pageNumber || "无"} 页
                                      {cite.sectionTitle && ` · ${cite.sectionTitle}`}
                                    </div>
                                  </div>
                                  <span className={cn("shrink-0 text-[10px] px-1.5 py-0.5 rounded-full", getRelationColor(cite.relation))}>
                                    {getRelationLabel(cite.relation)}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Export buttons at bottom */}
              <div className="p-4 border-t border-border flex items-center gap-2">
                <button
                  onClick={() => handleExport("md")}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-1.5" />
                  导出 Markdown
                </button>
                <button
                  onClick={() => handleExport("txt")}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                >
                  导出 TXT
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                >
                  打印
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-semibold mb-1">未选择简报</h3>
              <p className="text-sm text-muted-foreground">
                生成一份新的决策简报，或从左侧面板选择一个已保存的简报。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
