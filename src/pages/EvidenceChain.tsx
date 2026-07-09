import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Link2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ShieldMinus,
  ScrollText,
  Filter,
  ChevronRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Claim, Evidence } from "@/types";
import type { EvidenceRelation } from "@/types";
import { db } from "@/db/database";
import { demoClaims, demoEvidences } from "@/data/demo-data";
import {
  getRelationLabel,
  getRelationColor,
} from "@/services/citation/citation-mapper";
import { useAppStore } from "@/stores/app-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FilterTab = "all" | "support" | "contradict" | "unverified";

const CONFIDENCE_CONFIG: Record<
  Claim["confidence"],
  { label: string; icon: typeof ShieldCheck; className: string }
> = {
  high: {
    label: "高",
    icon: ShieldCheck,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  medium: {
    label: "中",
    icon: ShieldAlert,
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  low: {
    label: "低",
    icon: ShieldQuestion,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  unverified: {
    label: "待验证",
    icon: ShieldMinus,
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

const RELATION_ICON_MAP: Record<
  EvidenceRelation,
  typeof ThumbsUp
> = {
  support: ThumbsUp,
  contradict: ThumbsDown,
  complement: Link2,
  uncertain: HelpCircle,
};

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "全部证据" },
  { value: "support", label: "仅支持" },
  { value: "contradict", label: "仅反对" },
  { value: "unverified", label: "待验证" },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export function EvidenceChain() {
  const { openEvidenceDrawer } = useAppStore();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [loaded, setLoaded] = useState(false);

  // Load from IndexedDB, fall back to demo data
  const loadData = useCallback(async () => {
    try {
      const dbClaims = await db.claims.orderBy("createdAt").reverse().toArray();
      const dbEvidences = await db.evidences.toArray();

      if (dbClaims.length > 0) {
        setClaims(dbClaims);
        setEvidences(dbEvidences);
      } else {
        // Fall back to demo data
        setClaims(demoClaims);
        setEvidences(demoEvidences);
      }
    } catch {
      // Fall back to demo data on error
      setClaims(demoClaims);
      setEvidences(demoEvidences);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Select first claim by default when data loads
  useEffect(() => {
    if (loaded && claims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(claims[0].id);
    }
  }, [loaded, claims, selectedClaimId]);

  // --- Derived state ---

  const selectedClaim = useMemo(
    () => claims.find((c) => c.id === selectedClaimId) ?? null,
    [selectedClaimId, claims],
  );

  const claimEvidences = useMemo(() => {
    if (!selectedClaimId) return [];
    return evidences.filter((e) => e.claimId === selectedClaimId);
  }, [selectedClaimId, evidences]);

  const filteredEvidences = useMemo(() => {
    if (filterTab === "all") return claimEvidences;
    if (filterTab === "unverified") {
      // Show evidences with "uncertain" relation (not yet verified as support/contradict)
      return claimEvidences.filter((e) => e.relation === "uncertain");
    }
    return claimEvidences.filter((e) => e.relation === filterTab);
  }, [claimEvidences, filterTab]);

  // Select first claim by default
  const currentClaimId = selectedClaimId ?? claims[0]?.id ?? null;

  // --- Render helpers ---

  const renderConfidenceBadge = (confidence: Claim["confidence"]) => {
    const config = CONFIDENCE_CONFIG[confidence];
    const Icon = config.icon;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          config.className,
        )}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const renderRelationBadge = (relation: EvidenceRelation) => {
    const Icon = RELATION_ICON_MAP[relation];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          getRelationColor(relation),
        )}
      >
        <Icon className="w-3 h-3" />
        {getRelationLabel(relation)}
      </span>
    );
  };

  // --- Loading state ---
  if (!loaded) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-96 bg-muted rounded-xl" />
            <div className="h-96 bg-muted rounded-xl" />
            <div className="h-96 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // --- Empty state ---
  if (claims.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-20">
        <ScrollText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold mb-2">证据链</h1>
        <p className="text-muted-foreground mb-6">
          尚未生成任何结论或证据。在 AI 阅读中分析文档，即可构建你的证据链。
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/reader"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            前往 AI 阅读
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
          >
            返回工作台
          </Link>
        </div>
      </div>
    );
  }

  // --- Main layout ---
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回工作台
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold">证据链</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {claims.length} 条结论
            </span>
          </div>
        </div>
      </header>

      {/* Three-column body */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* ---- Left Panel: Claims ---- */}
        <aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card/30">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              结论
            </h2>
          </div>
          <div className="p-2 space-y-1">
            {claims.map((claim, i) => (
              <motion.button
                key={claim.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedClaimId(claim.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  claim.id === currentClaimId
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted border border-transparent",
                )}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <span className="text-xs text-muted-foreground mt-0.5 shrink-0">
                    C{i + 1}
                  </span>
                  <p className="text-sm leading-snug line-clamp-3">
                    {claim.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  {renderConfidenceBadge(claim.confidence)}
                </div>
                <div className="flex items-center gap-3 mt-2 pl-5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {claim.evidenceCount} 条证据
                  </span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <ThumbsUp className="w-3 h-3" />
                    {claim.supportCount}
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <ThumbsDown className="w-3 h-3" />
                    {claim.contradictCount}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </aside>

        {/* ---- Center Panel: Evidence Chain ---- */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {selectedClaim ? (
            <div className="p-6">
              {/* Selected claim detail header */}
              <motion.div
                key={selectedClaim.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-5 rounded-xl border border-border bg-card"
              >
                <div className="flex items-start gap-3 mb-3">
                  <ScrollText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{selectedClaim.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {renderConfidenceBadge(selectedClaim.confidence)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pl-8">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {selectedClaim.evidenceCount} 条证据
                  </span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <ThumbsUp className="w-3 h-3" />
                    {selectedClaim.supportCount} 支持
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <ThumbsDown className="w-3 h-3" />
                    {selectedClaim.contradictCount} 反对
                  </span>
                </div>
              </motion.div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 mb-4 p-1 bg-muted rounded-lg w-fit">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterTab(tab.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      filterTab === tab.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <Filter className="w-3 h-3" />
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Evidence cards */}
              <AnimatePresence mode="wait">
                {filteredEvidences.length > 0 ? (
                  <motion.div
                    key={filterTab + selectedClaim.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {filteredEvidences.map((evi, i) => (
                      <motion.div
                        key={evi.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="p-4 rounded-lg border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() =>
                          openEvidenceDrawer({
                            claimId: evi.claimId,
                            evidenceId: evi.id,
                          })
                        }
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {evi.documentName}
                            </span>
                          </div>
                          {renderRelationBadge(evi.relation)}
                        </div>

                        <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 py-1 mb-3 italic">
                          &ldquo;{evi.text}&rdquo;
                        </blockquote>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {evi.pageNumber && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                第 {evi.pageNumber} 页
                              </span>
                            )}
                            {evi.sectionTitle && (
                              <span className="flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                {evi.sectionTitle}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            查看详情
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Filter className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      暂无匹配证据。
                    </p>
                    <button
                      onClick={() => setFilterTab("all")}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      显示全部证据
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-16">
                <ScrollText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  从左侧面板选择一条结论查看其证据链。
                </p>
              </div>
            </div>
          )}
        </main>

        {/* ---- Right Panel: Summary / Quick Stats ---- */}
        <aside className="w-72 shrink-0 border-l border-border overflow-y-auto bg-card/30">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              概览
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {selectedClaim ? (
              <>
                {/* Evidence breakdown */}
                <div className="p-3 rounded-lg border border-border bg-background">
                  <p className="text-xs text-muted-foreground mb-2">
                    证据分类
                  </p>
                  <div className="space-y-2">
                    {(["support", "complement", "contradict", "uncertain"] as EvidenceRelation[]).map(
                      (rel) => {
                        const count = claimEvidences.filter(
                          (e) => e.relation === rel,
                        ).length;
                        const Icon = RELATION_ICON_MAP[rel];
                        return (
                          <div
                            key={rel}
                            className="flex items-center justify-between text-xs"
                          >
                            <span
                              className={cn(
                                "flex items-center gap-1.5",
                                getRelationColor(rel).split(" ")[0] +
                                  " " +
                                  getRelationColor(rel)
                                    .split(" ")
                                    .slice(1)
                                    .join(" "),
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              {getRelationLabel(rel)}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              {count}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Source documents */}
                <div className="p-3 rounded-lg border border-border bg-background">
                  <p className="text-xs text-muted-foreground mb-2">
                    引用文档
                  </p>
                  <ul className="space-y-1.5">
                    {Array.from(
                      new Map(
                        claimEvidences.map((e) => [e.documentId, e]),
                      ).values(),
                    ).map((evi) => (
                      <li
                        key={evi.documentId}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{evi.documentName}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tip */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    点击任意证据卡片，即可查看完整的引用上下文和文档来源信息。
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  选择一条结论查看证据详情。
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
