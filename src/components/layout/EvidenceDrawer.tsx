import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, MapPin, Link2 } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { getRelationLabel, getRelationColor } from "@/services/citation/citation-mapper";
import type { Evidence } from "@/types";

// Mock evidence data for demo
const DEMO_EVIDENCE: Evidence[] = [
  {
    id: "evi-001",
    claimId: "claim-001",
    citationId: "cite-001",
    documentId: "doc-003",
    documentName: "03-技术方案B-轻量前端+边缘计算.pdf",
    text: "本方案预计需要12周完成全部开发工作。总工期12周，完全符合需求文档的要求。",
    pageNumber: 2,
    sectionTitle: "开发周期估算",
    relation: "support",
    createdAt: "",
  },
  {
    id: "evi-002",
    claimId: "claim-001",
    citationId: "cite-004",
    documentId: "doc-002",
    documentName: "02-技术方案A-全栈Web应用.pdf",
    text: "本方案预计需要14周完成全部开发和测试工作。总工期14周，接近但略超需求文档中12周的要求。",
    pageNumber: 2,
    sectionTitle: "开发周期估算",
    relation: "complement",
    createdAt: "",
  },
];

export function EvidenceDrawer() {
  const { evidenceDrawerOpen, closeEvidenceDrawer } = useAppStore();

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
                <h2 className="text-lg font-semibold">Evidence Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Source documents and original text</p>
              </div>
              <button
                onClick={closeEvidenceDrawer}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(100%-65px)] p-6 space-y-4">
              {DEMO_EVIDENCE.map((evi) => (
                <div
                  key={evi.id}
                  className="p-4 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{evi.documentName}</span>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getRelationColor(evi.relation)}`}
                    >
                      {getRelationLabel(evi.relation)}
                    </span>
                  </div>

                  <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 py-1 mb-3 italic">
                    "{evi.text}"
                  </blockquote>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {evi.pageNumber && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Page {evi.pageNumber}
                      </span>
                    )}
                    {evi.sectionTitle && (
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {evi.sectionTitle}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {DEMO_EVIDENCE.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No evidence details available</p>
                  <p className="text-xs mt-1">Click a citation number to view evidence</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
