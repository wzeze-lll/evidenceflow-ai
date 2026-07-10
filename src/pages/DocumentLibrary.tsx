import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderOpen, Upload, Search, Grid3X3, List, Star, Trash2,
  FileType, AlertCircle, CheckCircle2, Loader2, X, Eye, Download,
} from "lucide-react";
import { db } from "@/db/database";
import { parseFile } from "@/services/documents/parser";
import { useAppStore } from "@/stores/app-store";
import type { Document } from "@/types";
import { formatDate, formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [detailDoc, setDetailDoc] = useState<Document | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const { loadDashboard } = useAppStore();

  const parseStatusLabel = (status: string) => {
    switch (status) {
      case "ready": return "就绪";
      case "parsing": return "解析中";
      case "error": return "错误";
      default: return status;
    }
  };

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await db.documents.toArray();
      docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setDocuments(docs);
    } catch {
      setDocuments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileUpload = async (files: FileList | File[]) => {
    setUploading(true);
    setUploadError(null);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Validate
      const validTypes = [".pdf", ".docx", ".doc", ".txt", ".md", ".markdown"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!validTypes.includes(ext)) {
        setUploadError(`不支持的文件类型：${file.name}。支持：PDF、DOCX、TXT、MD`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`文件过大：${file.name}。最大 50MB`);
        continue;
      }
      if (file.size === 0) {
        setUploadError(`文件为空：${file.name}`);
        continue;
      }

      // Check duplicate - filter in JS since fileName isn't indexed
      const allDocs = await db.documents.toArray();
      const existing = allDocs.find(d => d.fileName === file.name && d.parseStatus !== 'parsing');
      if (existing) {
        setUploadError(`文件已存在：${file.name}`);
        continue;
      }

      const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const pendingDoc: Document = {
          id: pendingId,
          workspaceId: "",
          fileName: file.name,
          fileType: ext.replace(".", "") as Document["fileType"],
          fileSize: file.size,
          pageCount: 0,
          wordCount: 0,
          parseStatus: "parsing",
          tags: [],
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          keywords: [],
          chunkCount: 0,
          summary: "",
        };
        await db.documents.put(pendingDoc);
        setDocuments((prev) => [pendingDoc, ...prev]);

        const { document, chunks } = await parseFile(file);

        // Ensure there's a non-demo workspace — create one if needed
        let workspaces = await db.workspaces.toArray();
        const nonDemoWs = workspaces.filter(w => !w.isDemo);
        let targetWs = nonDemoWs[0];
        if (!targetWs) {
          targetWs = {
            id: `ws-${Date.now()}`,
            name: "默认工作区",
            description: "默认工作区",
            documentIds: [] as string[],
            isDemo: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.workspaces.put(targetWs);
        }
        document.workspaceId = targetWs.id;
        await db.workspaces.update(targetWs.id, {
          documentIds: [...targetWs.documentIds, document.id],
        });

        await db.documents.delete(pendingId);
        await db.documents.put(document);
        await db.chunks.bulkPut(chunks);

        await db.activityLogs.put({
          id: `log-${Date.now()}`,
          action: "uploaded_document",
          entityType: "document",
          entityId: document.id,
          entityName: document.fileName,
          timestamp: new Date().toISOString(),
          details: `上传并解析完成：${chunks.length} 文本块`,
        });

        setDocuments((prev) => prev.map((d) => (d.id === pendingId ? document : d)));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setUploadError(`解析失败 ${file.name}: ${msg}`);
        setDocuments((prev) => prev.filter((d) => d.id !== pendingId));
        try { await db.documents.delete(pendingId); } catch {}
      }
    }
    setUploading(false);
    await loadDashboard();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    if (!window.confirm(`确认删除文档 "${doc.fileName}"？\n\n此操作将同时删除相关的对话记录、证据和文本块，且不可撤销。`)) return;

    // Delete conversations for this document
    const convs = await db.conversations.where("documentId").equals(docId).toArray();
    for (const conv of convs) {
      await db.claims.where("conversationId").equals(conv.id).delete();
      await db.conversations.delete(conv.id);
    }
    // Delete chunks, evidences, and document
    await db.chunks.where("documentId").equals(docId).delete();
    await db.evidences.where("documentId").equals(docId).delete();
    await db.documents.delete(docId);
    // Remove from workspace
    const workspaces = await db.workspaces.toArray();
    for (const ws of workspaces) {
      if (ws.documentIds.includes(docId)) {
        await db.workspaces.update(ws.id, {
          documentIds: ws.documentIds.filter(id => id !== docId),
        });
      }
    }
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setDetailDoc(null);
  };

  const toggleFavorite = async (doc: Document) => {
    const updated = { ...doc, isFavorite: !doc.isFavorite };
    await db.documents.put(updated);
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
  };

  const handleDownloadDoc = async (doc: Document) => {
    const chs = await db.chunks.where("documentId").equals(doc.id).toArray();
    const text = chs.map(c => c.content).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName.replace(/\.[^.]+$/, "") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const allTags = [...new Set(documents.flatMap((d) => d.tags))];

  const favorites = documents.filter((d) => d.isFavorite);
  const filtered = documents.filter((d) => {
    if (showFavorites && !d.isFavorite) return false;
    if (search && !d.fileName.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedTags.length > 0 && !selectedTags.some((t) => d.tags.includes(t))) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">文档库</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {showFavorites ? `${favorites.length} 份收藏` : `${documents.length} 份文档`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={cn(
              "p-2 rounded-md transition-colors",
              showFavorites ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "hover:bg-muted text-muted-foreground"
            )}
            title={showFavorites ? "显示全部" : "仅显示收藏"}
          >
            <Star className={cn("w-4 h-4", showFavorites && "fill-amber-400")} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground"
            title={viewMode === "grid" ? "列表视图" : "网格视图"}
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
          <label className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90">
            <Upload className="w-4 h-4" />
            上传
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.markdown"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => { if (e.target.files?.length) handleFileUpload(e.target.files); }}
            />
          </label>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文档..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs transition-colors",
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <label
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative block border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer"
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">拖拽文件至此处或点击浏览</p>
            <p className="text-xs text-muted-foreground">PDF、DOCX、TXT、Markdown · 单文件最大 50MB</p>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.markdown"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => { if (e.target.files?.length) { handleFileUpload(e.target.files); e.target.value = ''; } }}
            />
          </label>
          {uploading && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在解析文档...
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {uploadError}
              <button onClick={() => setUploadError(null)} className="ml-2">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </motion.div>

      {/* Document List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-2">
            {documents.length === 0 ? "暂无文档" : "无匹配文档"}
          </p>
          {documents.length === 0 && (
            <label className="inline-flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
              <Upload className="w-4 h-4" />
              上传你的第一份文档
              <input type="file" multiple accept=".pdf,.docx,.doc,.txt,.md,.markdown" className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
            </label>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <FileType className="w-8 h-8 text-muted-foreground/70" />
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleFavorite(doc)} title="收藏">
                    <Star className={cn("w-4 h-4", doc.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                  </button>
                  <button onClick={() => setDetailDoc(doc)} title="详情">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDownloadDoc(doc)} title="下载">
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} title="删除">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-sm truncate mb-1">{doc.fileName}</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{doc.pageCount} 页 · {formatFileSize(doc.fileSize)}</div>
                <div className="flex items-center gap-1">
                  {doc.parseStatus === "ready" ? (
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  ) : doc.parseStatus === "parsing" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-destructive" />
                  )}
                  {parseStatusLabel(doc.parseStatus)}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                <Link to={`/reader?doc=${doc.id}`} className="text-xs text-primary hover:underline">
                  在阅读器中打开 →
                </Link>
                <span className="text-xs text-muted-foreground">
                  {doc.chunkCount} 文本块
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:border-primary/20 transition-all">
              <FileType className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{doc.fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {doc.pageCount} 页 · {formatFileSize(doc.fileSize)} · {doc.chunkCount} 文本块
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{parseStatusLabel(doc.parseStatus)}</div>
              <Link to={`/reader?doc=${doc.id}`} className="text-xs text-primary hover:underline shrink-0">
                打开 →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {detailDoc && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDetailDoc(null)} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-card border-l border-border shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold">文档详情</h2>
              <button onClick={() => setDetailDoc(null)} className="p-1 rounded hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium">{detailDoc.fileName}</h3>
                <p className="text-xs text-muted-foreground mt-1">文件类型： {detailDoc.fileType}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">大小：</span> {formatFileSize(detailDoc.fileSize)}</div>
                <div><span className="text-muted-foreground">页数：</span> {detailDoc.pageCount}</div>
                <div><span className="text-muted-foreground">字数：</span> {detailDoc.wordCount}</div>
                <div><span className="text-muted-foreground">文本块：</span> {detailDoc.chunkCount}</div>
                <div><span className="text-muted-foreground">状态：</span> {parseStatusLabel(detailDoc.parseStatus)}</div>
                <div><span className="text-muted-foreground">创建时间：</span> {formatDate(detailDoc.createdAt)}</div>
              </div>
              {detailDoc.summary && (
                <div>
                  <h4 className="text-sm font-medium mb-1">摘要</h4>
                  <p className="text-sm text-muted-foreground">{detailDoc.summary}</p>
                </div>
              )}
              {detailDoc.keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">关键词</h4>
                  <div className="flex flex-wrap gap-1">
                    {detailDoc.keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 rounded-full bg-muted text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Link to={`/reader?doc=${detailDoc.id}`} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
                  在阅读器中打开
                </Link>
                <button onClick={() => handleDownloadDoc(detailDoc)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
                  <Download className="w-4 h-4 inline mr-1" />
                  下载
                </button>
                <button onClick={() => handleDelete(detailDoc.id)} className="px-4 py-2 rounded-lg border border-border text-sm text-destructive hover:bg-destructive/10">
                  删除
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
