import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Link2, AlertTriangle, GitCompare, FileText, ArrowRight, Sparkles } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { db } from "@/db/database";
import { demoDocuments, demoChunks, demoWorkspace, demoConversation, demoClaims, demoEvidences, demoConflicts, demoConsensusTopics, demoBrief, demoActivityLogs } from "@/data/demo-data";

const CAPABILITIES = [
  {
    icon: Link2,
    title: "证据链",
    description: "每个 AI 结论都绑定来源文档、原文片段、页码和证据关系，点击即可验证。",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: AlertTriangle,
    title: "冲突雷达",
    description: "自动发现多份文档之间的观点冲突，并排对比不同立场。",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: GitCompare,
    title: "共识地图",
    description: "识别多来源之间的共识主题，可视化展示已确认和仍存争议的观点。",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: FileText,
    title: "决策简报",
    description: "将复杂的多文档分析转化为结构化的、可执行的决策报告。",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
];

export function Welcome() {
  const navigate = useNavigate();
  const { loadDashboard } = useAppStore();

  const loadDemoWorkspace = async () => {
    // Check if demo already exists
    const existing = await db.workspaces.get("demo-workspace-001");
    if (!existing) {
      // Load all demo data
      await db.workspaces.put(demoWorkspace);
      await db.documents.bulkPut(demoDocuments);
      await db.chunks.bulkPut(demoChunks);
      await db.conversations.put(demoConversation);
      await db.claims.bulkPut(demoClaims);
      await db.evidences.bulkPut(demoEvidences);
      await db.conflicts.bulkPut(demoConflicts);
      await db.consensusTopics.bulkPut(demoConsensusTopics);
      await db.briefs.put(demoBrief);
      await db.activityLogs.bulkPut(demoActivityLogs);
    }
    await loadDashboard();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground mb-8">
              <Sparkles className="w-3 h-3" />
              从文档到证据，从证据到洞察，从洞察到决策。
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
              让每一个结论
              <br />
              <span className="text-primary">都有证据可循</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
              上传资料，发现共识、识别冲突、追踪证据，并将复杂信息转化为可执行的决策简报。
              <br />
              不是替你读文档，而是帮你从资料中找到可信答案。
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate("/documents?upload=1")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                <Upload className="w-4 h-4" />
                开始分析资料
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={loadDemoWorkspace}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                体验示例工作区
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">四项核心能力</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="p-6 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${cap.bgColor} flex items-center justify-center mb-4`}>
                <cap.icon className={`w-5 h-5 ${cap.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{cap.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Upload Zone */}
      <section className="py-16 px-4 max-w-2xl mx-auto">
        <div
          onClick={() => navigate("/documents?upload=1")}
          className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-all group"
        >
          <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <h3 className="text-lg font-semibold mb-2">拖拽或点击上传文档</h3>
          <p className="text-sm text-muted-foreground">
            支持 PDF、DOCX、TXT、Markdown 格式
            <br />
            所有文件在本地解析，保护您的隐私
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground border-t border-border">
        证流 AI — 从文档到证据，从证据到洞察，从洞察到决策。
      </footer>
    </div>
  );
}
