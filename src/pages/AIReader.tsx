import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Send, Loader2, FileText, ExternalLink, Copy, Check, Download, Trash2,
} from "lucide-react";
import { db } from "@/db/database";
import { getAIProvider } from "@/services/ai/provider";
import { retrieveRelevantChunks } from "@/services/retrieval/keyword-retrieval";
import { getRelationLabel, getRelationColor } from "@/services/citation/citation-mapper";
import { useAppStore } from "@/stores/app-store";
import type { Document, DocumentChunk, AIMessage, AIConversation } from "@/types";
import { cn, generateId } from "@/lib/utils";

function makeWelcomeMsg(): AIMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: "你好！我已分析了你的文档。你可以针对文档内容提问，我会引用原文来支撑回答。试试询问关键发现、对比分析或具体话题。",
    citations: [],
    createdAt: new Date().toISOString(),
  };
}

export function AIReader() {
  const [searchParams] = useSearchParams();
  // Parse doc from hash query (HashRouter) or regular search params
  const docParam = searchParams.get("doc") || new URLSearchParams(window.location.hash.split("?")[1] || "").get("doc");
  const docId = docParam;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([makeWelcomeMsg()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { openEvidenceDrawer } = useAppStore();

  // Load data for a specific document (or all documents if null).
  // Accepts a targetDocId to support both URL-based initial load and
  // sidebar clicks (which do not change the URL).
  const loadDataForDoc = useCallback(async (targetDocId: string | null) => {
    const docs = await db.documents.toArray();
    setDocuments(docs);

    if (targetDocId) {
      const doc = docs.find(d => d.id === targetDocId) ?? null;
      if (doc) {
        setSelectedDoc(doc);
        const chs = await db.chunks.where("documentId").equals(targetDocId).toArray();
        setChunks(chs);

        // Load existing conversation for this specific document
        const conv = await db.conversations.where("documentId").equals(targetDocId).first();
        if (conv && conv.messages.length > 0) {
          setConversation(conv);
          setMessages(conv.messages);
        } else {
          const newConv: AIConversation = {
            id: generateId(),
            documentId: targetDocId,
            messages: [makeWelcomeMsg()],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setConversation(newConv);
          setMessages([makeWelcomeMsg()]);
        }
      }
    } else {
      // "全部文档" mode — load chunks from EVERY document
      setSelectedDoc(null);
      const chs = await db.chunks.toArray();
      setChunks(chs);

      // Load general conversation (documentId = "" marks the global conversation)
      const conv = await db.conversations.where("documentId").equals("").first();
      if (conv && conv.messages.length > 0) {
        setConversation(conv);
        setMessages(conv.messages);
      } else {
        setConversation(null);
        setMessages([makeWelcomeMsg()]);
      }
    }
  }, []);

  // Initial load from URL param on mount / URL change
  useEffect(() => {
    loadDataForDoc(docId || null);
  }, [docId, loadDataForDoc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      citations: [],
      createdAt: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Ensure we have a conversation object (create one if needed)
    let conv: AIConversation;
    if (conversation) {
      conv = conversation;
    } else {
      conv = {
        id: generateId(),
        documentId: selectedDoc?.id || "",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    // Save user message into the conversation
    const msgsWithUser = [...conv.messages, userMsg];
    setMessages(msgsWithUser);
    conv = { ...conv, messages: msgsWithUser, updatedAt: new Date().toISOString() };
    setConversation(conv);
    await db.conversations.put(conv);

    try {
      const provider = getAIProvider();
      // Get more chunks to ensure coverage across all documents
      let results = retrieveRelevantChunks(userMsg.content, chunks, 20);
      // Ensure diversity: include at least 1 chunk from each document when in "全部文档" mode
      if (!selectedDoc && documents.length > 1) {
        const seen = new Set(results.map(r => r.chunk.documentId));
        for (const doc of documents) {
          if (!seen.has(doc.id)) {
            const docChunks = chunks.filter(c => c.documentId === doc.id);
            if (docChunks.length > 0) {
              results.push({ chunk: docChunks[0], score: 0.1 });
              seen.add(doc.id);
            }
          }
        }
      }
      const relevantChunks = results.map((r) => r.chunk);
      const relevantDocs = selectedDoc ? [selectedDoc] : documents;

      const response = await provider.chat(
        msgsWithUser.map((m) => ({ role: m.role, content: m.content })),
        { chunks: relevantChunks, documents: relevantDocs }
      );

      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: response.content,
        citations: response.citations,
        createdAt: new Date().toISOString(),
      };
      const finalMessages = [...msgsWithUser, assistantMsg];
      setMessages(finalMessages);

      // Save conversation with assistant message
      conv = { ...conv, messages: finalMessages, updatedAt: new Date().toISOString() };
      await db.conversations.put(conv);
      setConversation(conv);

      // Save claim + evidence to DB for Evidence Chain
      if (response.citations.length > 0) {
        const claimId = generateId();
        const supportCount = response.citations.filter(c => c.relation === 'support').length;
        const contradictCount = response.citations.filter(c => c.relation === 'contradict').length;

        await db.claims.put({
          id: claimId,
          conversationId: conv.id,
          content: `**问题：** ${userMsg.content}\n\n**回答：** ${assistantMsg.content}`,
          confidence: supportCount > 0 ? 'high' : 'medium',
          evidenceCount: response.citations.length,
          supportCount,
          contradictCount,
          createdAt: new Date().toISOString(),
        });

        for (const cite of response.citations) {
          await db.evidences.put({
            id: cite.id,
            claimId,
            citationId: cite.id,
            documentId: cite.documentId,
            documentName: cite.documentName,
            text: cite.text,
            pageNumber: cite.pageNumber,
            sectionTitle: cite.sectionTitle,
            relation: cite.relation,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      const errorMsg: AIMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `抱歉，出错了：${err instanceof Error ? err.message : "未知错误"}。请重试。`,
        citations: [],
        createdAt: new Date().toISOString(),
      };
      const finalMessages = [...msgsWithUser, errorMsg];
      setMessages(finalMessages);
      conv = { ...conv, messages: finalMessages, updatedAt: new Date().toISOString() };
      await db.conversations.put(conv);
      setConversation(conv);
    }
    setLoading(false);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConversation = async () => {
    if (conversation) {
      await db.conversations.delete(conversation.id);
    }
    setMessages([makeWelcomeMsg()]);
    setConversation(null);
  };

  const handleDownloadDoc = (doc: Document) => {
    // Download the text content of a document
    db.chunks.where("documentId").equals(doc.id).toArray().then((chs) => {
      const text = chs.map((c) => c.content).join("\n\n");
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left: Document Outline */}
      <div className="w-64 border-r border-border p-4 overflow-y-auto shrink-0 hidden lg:flex flex-col">
        <h3 className="text-sm font-semibold mb-3">文档</h3>
        <div className="space-y-1 flex-1">
          <button
            onClick={() => loadDataForDoc(null)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
              !selectedDoc ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted text-muted-foreground"
            )}
          >
            全部文档 ({documents.length})
          </button>
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center group">
              <button
                onClick={() => loadDataForDoc(doc.id)}
                className={cn(
                  "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors truncate",
                  selectedDoc?.id === doc.id ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <FileText className="w-3 h-3 inline mr-1.5" />
                {doc.fileName}
              </button>
              <button
                onClick={() => handleDownloadDoc(doc)}
                className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
                title="下载"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={async () => {
                  await db.documents.delete(doc.id);
                  await db.chunks.where("documentId").equals(doc.id).delete();
                  await db.conversations.where("documentId").equals(doc.id).delete();
                  loadDataForDoc(null);
                }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive shrink-0"
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">暂无文档</p>
          )}
        </div>

        {selectedDoc && chunks.length > 0 && (
          <>
            <h3 className="text-sm font-semibold mt-4 mb-3">章节</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {[...new Set(chunks.map((c) => c.sectionTitle).filter(Boolean))].map((title) => (
                <div key={title} className="px-3 py-1.5 text-xs text-muted-foreground truncate">
                  {title}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Export & Delete buttons */}
        <div className="mt-4 space-y-1 border-t border-border pt-3">
          {messages.length > 1 && (
            <>
              <button
                onClick={() => {
                  const docName = selectedDoc?.fileName || "全局对话";
                  // Group messages by date
                  const fmtTime = (iso: string) => {
                    const d = new Date(iso);
                    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                  };
                  const fmtDate = (iso: string) => {
                    const d = new Date(iso);
                    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
                  };
                  const msgs = messages.filter(m => m.id !== "welcome");
                  const grouped: Record<string, typeof msgs> = {};
                  for (const m of msgs) {
                    const day = fmtDate(m.createdAt);
                    if (!grouped[day]) grouped[day] = [];
                    grouped[day].push(m);
                  }
                  // Build markdown
                  let md = `# 聊天记录\n\n**文档：** ${docName}\n**导出时间：** ${fmtTime(new Date().toISOString())}\n\n---\n\n`;
                  for (const [day, dayMsgs] of Object.entries(grouped)) {
                    md += `## ${day}\n\n`;
                    for (const m of dayMsgs) {
                      md += `**${m.role === "user" ? "🧑 用户" : "🤖 AI"}**（${fmtTime(m.createdAt)}）\n\n${m.content}\n\n`;
                      if (m.citations?.length) {
                        md += `> 引用来源：${m.citations.length} 条\n\n`;
                      }
                      md += `---\n\n`;
                    }
                  }
                  const blob = new Blob([md], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `聊天记录_${docName}_${new Date().toISOString().slice(0, 10)}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              >
                <Download className="w-3 h-3" />
                导出当前对话 (Markdown)
              </button>
              <button
                onClick={async () => {
                  const allConvs = await db.conversations.toArray();
                  const allDocs = await db.documents.toArray();
                  const fmtTime = (iso: string) => {
                    const d = new Date(iso);
                    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                  };
                  const fmtDate = (iso: string) => {
                    const d = new Date(iso);
                    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
                  };
                  let md = `# 全部聊天记录\n\n**导出时间：** ${fmtTime(new Date().toISOString())}\n\n---\n\n`;
                  for (const c of allConvs) {
                    const doc = allDocs.find(d => d.id === c.documentId);
                    const docName = doc?.fileName || "全局对话";
                    md += `# ${docName}\n\n`;
                    const msgs = c.messages.filter(m => m.id !== "welcome");
                    if (msgs.length === 0) { md += "_（无消息）_\n\n"; continue; }
                    const grouped: Record<string, typeof msgs> = {};
                    for (const m of msgs) {
                      const day = fmtDate(m.createdAt);
                      if (!grouped[day]) grouped[day] = [];
                      grouped[day].push(m);
                    }
                    for (const [day, dayMsgs] of Object.entries(grouped)) {
                      md += `## ${day}\n\n`;
                      for (const m of dayMsgs) {
                        md += `**${m.role === "user" ? "🧑 用户" : "🤖 AI"}**（${fmtTime(m.createdAt)}）\n\n${m.content}\n\n`;
                        md += `---\n\n`;
                      }
                    }
                    md += `\n`;
                  }
                  const blob = new Blob([md], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `全部聊天记录_${new Date().toISOString().slice(0, 10)}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              >
                <Download className="w-3 h-3" />
                导出全部聊天 (Markdown)
              </button>
              <button
                onClick={handleDeleteConversation}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                清除对话记录
              </button>
            </>
          )}
        </div>
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("max-w-3xl", msg.role === "user" ? "ml-auto" : "")}
            >
              <div
                className={cn(
                  "rounded-xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                )}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">来源：</div>
                    <div className="space-y-1.5">
                      {msg.citations.map((cite, idx) => (
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
                              第 {cite.pageNumber || "?"} 页
                              {cite.sectionTitle && ` · ${cite.sectionTitle}`}
                            </div>
                          </div>
                          <span className={cn("shrink-0 text-[10px] px-1.5 py-0.5 rounded-full", getRelationColor(cite.relation))}>
                            {getRelationLabel(cite.relation)}
                          </span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.id !== "welcome" && (
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                    title="复制"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              思考中...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={selectedDoc ? `询问 "${selectedDoc.fileName}" 相关内容...` : "询问你的文档..."}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary/40 transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {selectedDoc
              ? `当前文档：${selectedDoc.fileName}（${chunks.length} 个文本块）`
              : `搜索范围：${documents.length} 份文档（${chunks.length} 个文本块）`}
          </p>
        </div>
      </div>
    </div>
  );
}
