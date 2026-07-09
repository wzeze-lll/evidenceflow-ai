import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, MapPin, Link2, Loader2, ExternalLink } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { db } from "@/db/database";
import { getRelationLabel, getRelationColor } from "@/services/citation/citation-mapper";
import type { Evidence } from "@/types";

export function EvidenceDrawer() {
  const { evidenceDrawerOpen, closeEvidenceDrawer, evidenceDrawerData } = useAppStore();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (evidenceDrawerOpen && evidenceDrawerData) {
      loadEvidence();
    }
  }, [evidenceDrawerOpen, evidenceDrawerData]);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      if (evidenceDrawerData?.claimId) {
        // Load all evidence for a claim
        const evids = await db.evidences.where("claimId").equals(evidenceDrawerData.claimId).toArray();
        setEvidences(evids);
      } else if (evidenceDrawerData?.evidenceId) {
        // Load single evidence
        const evid = await db.evidences.get(evidenceDrawerData.evidenceId);
        setEvidences(evid ? [evid] : []);
      } else {
        // Load all evidence
        const all = await db.evidences.orderBy("createdAt").reverse().limit(20).toArray();
        setEvidences(all.length > 0 ? all : []);
      }
    } catch {
      setEvidences([]);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {evidenceDrawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={closeEvidenceDrawer} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-card border-l border-border shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">证据详情</h2>
                <p className="text-xs text-muted-foreground mt-0.5">来源文档与原文摘录</p>
              </div>
              <button onClick={closeEvidenceDrawer} className="p-2 rounded-md hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(100%-65px)] p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  加载中...
                </div>
              ) : evidences.length > 0 ? (
                evidences.map((evi) => (
                  <div key={evi.id} className="p-4 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => { closeEvidenceDrawer(); navigate(`/reader?doc=${evi.documentId}`); }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{evi.documentName}</span>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getRelationColor(evi.relation)}`}>
                        {getRelationLabel(evi.relation)}
                      </span>
                    </div>

                    <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 py-1 mb-3 italic">
                      "{evi.text.slice(0, 300)}{evi.text.length > 300 ? '...' : ''}"
                    </blockquote>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
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
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <ExternalLink className="w-3 h-3" />
                        在阅读器中打开
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无证据数据</p>
                  <p className="text-xs mt-1">在 AI 阅读中提问后，证据会自动生成</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
