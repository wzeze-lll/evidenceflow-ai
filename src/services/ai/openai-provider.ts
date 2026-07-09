import type { AIProvider } from "./types";
import type {
  Citation,
  ConflictItem,
  ConsensusTopic,
  DecisionBrief,
  Document,
  DocumentChunk,
} from "@/types";
import { generateId } from "@/lib/utils";

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: string;
  readonly id: string;
  private config: ProviderConfig;

  constructor(config: ProviderConfig, name: string, id: string) {
    this.config = config;
    this.name = name;
    this.id = id;
  }

  async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: "user", content: "Hello, respond with just 'ok'." }],
          max_tokens: 10,
        }),
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const err = await res.text();
        return { ok: false, message: `HTTP ${res.status}: ${err.slice(0, 200)}`, latencyMs };
      }
      return { ok: true, message: `Connected (${latencyMs}ms)`, latencyMs };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Connection failed",
        latencyMs: Date.now() - start,
      };
    }
  }

  async chat(
    messages: { role: string; content: string }[],
    context?: { chunks: DocumentChunk[]; documents: Document[] }
  ): Promise<{ content: string; citations: Citation[] }> {
    const systemPrompt = this.buildSystemPrompt(context);
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: allMessages,
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI API error (${res.status}): ${err.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "No response from AI.";

    // Parse citations from response if marked
    const citations = this.parseCitations(content, context);
    return { content, citations };
  }

  async streamChat(
    messages: { role: string; content: string }[],
    context?: { chunks: DocumentChunk[]; documents: Document[] },
    onChunk?: (text: string) => void
  ): Promise<{ content: string; citations: Citation[] }> {
    const systemPrompt = this.buildSystemPrompt(context);
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: allMessages,
        temperature: 0.3,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI API error (${res.status}): ${err.slice(0, 300)}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || "";
            fullContent += delta;
            if (onChunk) onChunk(delta);
          } catch {
            // skip parse errors
          }
        }
      }
    }

    const citations = this.parseCitations(fullContent, context);
    return { content: fullContent, citations };
  }

  async summarize(
    document: Document,
    chunks: DocumentChunk[],
    mode: string
  ): Promise<{ content: string; citations: Citation[] }> {
    const ctx = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: `You are a document analyst. Provide a ${mode} summary of the document. Include key points, important data, and suggested actions. Reference source chunks by their numbers in brackets like [1], [2].`,
          },
          {
            role: "user",
            content: `Document: ${document.fileName}\n\nContent:\n${ctx}\n\nPlease provide a ${mode} summary.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });
    if (!res.ok) throw new Error(`Summarization failed: ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { content, citations: this.parseCitations(content, { chunks, documents: [document] }) };
  }

  async compareDocuments(
    documents: Document[],
    relevantChunks: DocumentChunk[][]
  ): Promise<{ content: string; citations: Citation[] }> {
    const allChunks = relevantChunks.flat();
    const ctx = documents
      .map((d, i) => {
        const chs = relevantChunks[i] || [];
        return `Document ${i + 1}: ${d.fileName}\n${chs.map((c, j) => `[${i + 1}-${j + 1}] ${c.content}`).join("\n")}`;
      })
      .join("\n\n");

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "You are a document analyst. Compare multiple documents and identify similarities, differences, common themes, and unique perspectives.",
          },
          { role: "user", content: `Compare these documents:\n\n${ctx}` },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) throw new Error(`Comparison failed: ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { content, citations: this.parseCitations(content, { chunks: allChunks, documents }) };
  }

  async detectConflicts(
    _documentIds: string[],
    documents: Document[],
    chunks: DocumentChunk[]
  ): Promise<ConflictItem[]> {
    // Build per-document context for better comparison
    const docMap = new Map<string, { name: string; texts: string[] }>();
    for (const c of chunks) {
      const doc = documents.find((d) => d.id === c.documentId);
      if (!doc) continue;
      if (!docMap.has(doc.id)) docMap.set(doc.id, { name: doc.fileName, texts: [] });
      docMap.get(doc.id)!.texts.push(c.content.slice(0, 500));
    }

    const docContexts = Array.from(docMap.entries()).map(([, info]) =>
      `【文档：${info.name}】\n${info.texts.map((t, j) => `[片段${j + 1}] ${t}`).join("\n")}`
    ).join("\n\n========\n\n");

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: `你是一个专业的文档分析专家。你的任务是找出多份文档之间的所有差异和潜在冲突。

重要：即使文档看起来一致，也要找出以下类型的差异：
1. 数据差异 - 数字、日期、数量、百分比不同
2. 观点差异 - 对同一问题的不同看法或结论
3. 定义差异 - 对同一术语的不同定义或理解
4. 范围差异 - 涵盖范围、侧重点不同
5. 方法论差异 - 不同的方法、步骤、方案
6. 细节差异 - 任何细节上的不一致

即使差异很小，也要列出来。用户需要看到所有可能的分歧点。

返回 JSON 数组（不要markdown代码块）：
[
  {
    "topic": "冲突主题（中文）",
    "level": "high" | "medium" | "low",
    "type": "data" | "definition" | "opinion" | "timeline" | "methodology",
    "documents": [
      {
        "documentRef": "文档名称",
        "viewpoint": "该文档的观点（中文）",
        "evidence": "原文引用"
      }
    ],
    "aiAnalysis": "差异分析和影响（中文）",
    "suggestedVerification": "验证建议（中文）"
  }
]

至少返回2-3个差异。如果实在找不到任何差异，说明文档可能在讨论不同主题。`,
          },
          {
            role: "user",
            content: `请分析以下 ${documents.length} 份文档之间的所有差异和冲突：\n\n${docContexts}\n\n找出所有差异点，返回 JSON 数组。`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) throw new Error(`Conflict detection failed: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    try {
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/```/g, "").trim();
      const arrStart = jsonStr.indexOf("[");
      const arrEnd = jsonStr.lastIndexOf("]") + 1;
      const cleanJson = arrStart >= 0 ? jsonStr.slice(arrStart, arrEnd) : jsonStr;
      const conflicts: ConflictItem[] = JSON.parse(cleanJson || "[]");

      // Map document names back to IDs
      return conflicts.map((c) => ({
        ...c,
        id: generateId(),
        createdAt: new Date().toISOString(),
        documents: c.documents.map((d: any) => {
          const matched = documents.find((doc) => d.documentRef && doc.fileName.includes(d.documentRef));
          return {
            documentId: matched?.id || documents[0]?.id || "",
            documentName: d.documentRef || matched?.fileName || "",
            viewpoint: d.viewpoint || "",
            evidence: d.evidence || "",
          };
        }),
      }));
    } catch (parseErr) {
      console.warn("[detectConflicts] Parse failed, using local analysis:", parseErr);
      return generateLocalConflicts(documents, chunks);
    }
  }

  async generateConsensusTopics(
    _documentIds: string[],
    documents: Document[],
    chunks: DocumentChunk[]
  ): Promise<ConsensusTopic[]> {
    const ctx = chunks.map((c, i) => {
      const doc = documents.find((d) => d.id === c.documentId);
      return `[Chunk ${i + 1}] From "${doc?.fileName}":\n${c.content}`;
    }).join("\n\n---\n\n");

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: `You are a document consensus analyzer. Identify topics where multiple documents agree.

Return a valid JSON array:
[
  {
    "topic": "Topic name",
    "level": "strong" | "moderate" | "weak" | "contested",
    "description": "Description of the consensus",
    "supportingDocuments": [
      {"documentRef": "Chunk ref", "excerpt": "Supporting quote"}
    ],
    "opposingDocuments": [],
    "coveragePercentage": 75
  }
]

Return only the JSON array. Focus on meaningful agreements across documents.`,
          },
          {
            role: "user",
            content: `Analyze these document chunks for consensus:\n\n${ctx}\n\nReturn consensus topics as a JSON array.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) throw new Error(`Consensus analysis failed: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    try {
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const topics: ConsensusTopic[] = JSON.parse(jsonStr);
      return topics.map((t) => ({
        ...t,
        id: generateId(),
        supportingDocuments: t.supportingDocuments.map((s: Record<string, string>) => ({
          documentId: documents[0]?.id || "",
          documentName: documents[0]?.fileName || "",
          excerpt: s.excerpt || "",
        })),
        opposingDocuments: (t.opposingDocuments || []).map((o: Record<string, string>) => ({
          documentId: documents[0]?.id || "",
          documentName: documents[0]?.fileName || "",
          excerpt: o.excerpt || "",
        })),
      }));
    } catch {
      return [];
    }
  }

  async generateDecisionBrief(
    params: {
      projectId: string;
      title: string;
      target: string;
      audience: string;
      detail: string;
    },
    documents: Document[],
    chunks: DocumentChunk[]
  ): Promise<DecisionBrief> {
    const ctx = chunks.map((c, i) => {
      const doc = documents.find((d) => d.id === c.documentId);
      return `[Chunk ${i + 1}] From "${doc?.fileName}":\n${c.content}`;
    }).join("\n\n---\n\n");

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: `You are a decision brief generator. Create a structured decision brief from document analysis.

Return a valid JSON object:
{
  "sections": [
    {"title": "I. Problem Definition", "content": "...", "order": 1},
    {"title": "II. Key Facts", "content": "...", "order": 2},
    {"title": "III. Consensus", "content": "...", "order": 3},
    {"title": "IV. Conflicts", "content": "...", "order": 4},
    {"title": "V. Option Comparison", "content": "...", "order": 5},
    {"title": "VI. Risks", "content": "...", "order": 6},
    {"title": "VII. Information Gaps", "content": "...", "order": 7},
    {"title": "VIII. Recommendation", "content": "...", "order": 8},
    {"title": "IX. Next Steps", "content": "...", "order": 9}
  ]
}

Write in Chinese if the source documents are in Chinese. Each section should be substantive (50-200 words). Reference source chunks by number.`,
          },
          {
            role: "user",
            content: `Generate a decision brief titled "${params.title}" for ${params.target} audience (${params.detail} detail).\n\nDocuments:\n${ctx}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) throw new Error(`Brief generation failed: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    try {
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      return {
        id: generateId(),
        projectId: params.projectId,
        title: params.title,
        target: params.target as DecisionBrief["target"],
        audience: params.audience as DecisionBrief["audience"],
        detail: params.detail as DecisionBrief["detail"],
        sections: (parsed.sections || []).map((s: Record<string, unknown>) => ({
          id: generateId(),
          title: String(s.title || ""),
          content: String(s.content || ""),
          citations: [],
          order: Number(s.order || 0),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return {
        id: generateId(),
        projectId: params.projectId,
        title: params.title,
        target: params.target as DecisionBrief["target"],
        audience: params.audience as DecisionBrief["audience"],
        detail: params.detail as DecisionBrief["detail"],
        sections: [
          {
            id: generateId(),
            title: "I. Analysis",
            content: text.slice(0, 2000),
            citations: [],
            order: 1,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  private buildSystemPrompt(context?: { chunks: DocumentChunk[]; documents: Document[] }): string {
    let prompt = `You are an intelligent document analysis assistant for EvidenceFlow AI.
Your purpose is to help users understand and analyze their documents.

Core principles:
1. Always cite specific source chunks when making claims. Reference chunks by their [Chunk N] identifier.
2. Be honest about what the documents do and don't say.
3. When multiple documents disagree, point out the disagreement rather than picking sides arbitrarily.
4. Distinguish between facts from documents and your own analysis/opinion.
5. When information is missing, tell the user what's missing.

Language: Respond in the same language as the user's question. For Chinese documents, respond in Chinese.

`;

    if (context?.chunks && context.chunks.length > 0) {
      prompt += `\n--- REFERENCE DOCUMENTS ---\n`;
      for (let i = 0; i < context.chunks.length; i++) {
        const chunk = context.chunks[i];
        const doc = context.documents?.find((d) => d.id === chunk.documentId);
        prompt += `\n[Chunk ${i + 1}] From "${doc?.fileName || "unknown"}"`;
        if (chunk.pageNumber) prompt += ` (Page ${chunk.pageNumber})`;
        if (chunk.sectionTitle) prompt += ` - ${chunk.sectionTitle}`;
        prompt += `:\n${chunk.content}\n`;
      }
    }

    return prompt;
  }

  private parseCitations(
    content: string,
    context?: { chunks: DocumentChunk[]; documents: Document[] }
  ): Citation[] {
    if (!context?.chunks || context.chunks.length === 0) return [];
    const citations: Citation[] = [];
    // Match [Chunk N] or [N] references
    const refRegex = /\[Chunk\s*(\d+)\]|\[(\d+)\]/g;
    const seen = new Set<number>();
    let match;
    while ((match = refRegex.exec(content)) !== null) {
      const idx = parseInt(match[1] || match[2]) - 1;
      if (idx >= 0 && idx < context.chunks.length && !seen.has(idx)) {
        seen.add(idx);
        const chunk = context.chunks[idx];
        const doc = context.documents?.find((d) => d.id === chunk.documentId);
        citations.push({
          id: generateId(),
          chunkId: chunk.id,
          documentId: chunk.documentId,
          documentName: doc?.fileName || "Unknown",
          text: chunk.content.slice(0, 300),
          pageNumber: chunk.pageNumber,
          sectionTitle: chunk.sectionTitle,
          relation: "support",
          relevanceScore: 0.9,
        });
      }
    }
    return citations.slice(0, 5);
  }
}

// Local fallback: basic conflict detection without AI
function generateLocalConflicts(documents: Document[], chunks: DocumentChunk[]): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  if (documents.length < 2) return conflicts;

  // Group chunks by document
  const docTexts = new Map<string, string[]>();
  for (const c of chunks) {
    if (!docTexts.has(c.documentId)) docTexts.set(c.documentId, []);
    docTexts.get(c.documentId)!.push(c.content);
  }

  // Compare document lengths
  const lengths = Array.from(docTexts.entries()).map(([id, texts]) => ({
    id,
    name: documents.find(d => d.id === id)?.fileName || id,
    length: texts.join(" ").length,
    wordCount: texts.join(" ").split(/\s+/).length,
  }));

  if (lengths.length >= 2) {
    const max = lengths.reduce((a, b) => a.length > b.length ? a : b);
    const min = lengths.reduce((a, b) => a.length < b.length ? a : b);
    if (max.length > min.length * 1.5) {
      conflicts.push({
        id: generateId(),
        topic: "文档篇幅差异",
        level: "low",
        type: "data",
        documents: [
          { documentId: max.id, documentName: max.name, viewpoint: `${max.wordCount} 词`, evidence: "文档内容较多" },
          { documentId: min.id, documentName: min.name, viewpoint: `${min.wordCount} 词`, evidence: "文档内容较少" },
        ],
        aiAnalysis: `两份文档篇幅差异较大（${max.wordCount} vs ${min.wordCount} 词），可能覆盖范围不同或详略程度不同。`,
        suggestedVerification: "检查文档是否涵盖相同主题范围，确认是否需要补充内容。",
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Compare keywords (simple word frequency)
  const allKeywords = documents.flatMap(d => d.keywords.slice(0, 5));
  const uniqueKeywords = [...new Set(allKeywords)];
  for (const kw of uniqueKeywords.slice(0, 3)) {
    const docsWith = documents.filter(d => d.keywords.includes(kw));
    const docsWithout = documents.filter(d => !d.keywords.includes(kw));
    if (docsWith.length > 0 && docsWithout.length > 0) {
      conflicts.push({
        id: generateId(),
        topic: `关键词覆盖差异：${kw}`,
        level: "low",
        type: "definition",
        documents: [
          { documentId: docsWith[0].id, documentName: docsWith[0].fileName, viewpoint: `提及"${kw}"`, evidence: `该文档涉及${kw}相关内容` },
          { documentId: docsWithout[0].id, documentName: docsWithout[0].fileName, viewpoint: `未提及"${kw}"`, evidence: "该文档未涉及该主题" },
        ],
        aiAnalysis: `"${kw}" 在部分文档中出现，其他文档未涉及，可能说明文档侧重点不同。`,
        suggestedVerification: "检查各文档的主题覆盖范围，确认是否存在信息缺失。",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return conflicts.slice(0, 5);
}
