import type { AIProvider } from "./types";
import type { Citation, ConflictItem, ConsensusTopic, DecisionBrief, Document, DocumentChunk } from "@/types";
import { generateId } from "@/lib/utils";

const RELATION_TYPES = ["support", "complement"] as const;

function makeCitations(chunks: DocumentChunk[], documents: Document[], count: number): Citation[] {
  if (chunks.length === 0 || documents.length === 0) return [];
  const citations: Citation[] = [];
  for (let i = 0; i < Math.min(count, chunks.length); i++) {
    const chunk = chunks[i % chunks.length];
    const doc = documents.find((d) => d.id === chunk.documentId) || documents[0];
    citations.push({
      id: generateId(),
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentName: doc.fileName,
      text: chunk.content.slice(0, 200),
      pageNumber: chunk.pageNumber,
      sectionTitle: chunk.sectionTitle,
      relation: RELATION_TYPES[i % 2],
      relevanceScore: 0.9 - i * 0.05,
    });
  }
  return citations;
}

export class MockProvider implements AIProvider {
  readonly name = "Mock Demo Provider";
  readonly id = "mock";
  readonly warningMessage?: string;

  constructor(warningMessage?: string) {
    this.warningMessage = warningMessage;
  }

  async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return { ok: true, message: "Mock provider is always available", latencyMs: 350 };
  }

  async chat(
    messages: { role: string; content: string }[],
    context?: { chunks: DocumentChunk[]; documents: Document[] }
  ): Promise<{ content: string; citations: Citation[] }> {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    const chunks = context?.chunks || [];
    const documents = context?.documents || [];
    const lastMsg = messages.filter((m) => m.role === "user").pop();
    const question = lastMsg?.content || "";

    // Only detect actual greetings, not short questions
    const greetings = ["你好", "nihao", "hello", "hi", "嗨", "在吗", "你是谁", "你能做什么", "介绍一下自己", "怎么用", "帮助", "help"];
    const q = question.toLowerCase().replace(/[\s,，。.！!？?]/g, "");
    const isGreeting = greetings.some(g => q === g.toLowerCase().replace(/[\s,，。.！!？?]/g, "")) || q === "";
    if (isGreeting && documents.length > 0) {
      return {
        content: `你好！我是证流 AI 文档助手。\n\n当前已加载 ${documents.length} 份文档：${documents.map(d => `《${d.fileName}》`).join("、")}\n\n你可以直接问我文档相关的问题，比如："总结一下这些文档的主要内容"、"这几份文档有什么共同点"、"文档中有哪些不同的观点"\n\n注意：当前是 Mock 演示模式，回答基于本地分析。在设置中配置 DeepSeek API Key 可获得更智能的 AI 分析。`,
        citations: [],
      };
    }

    if (chunks.length === 0) {
      return {
        content: `我在当前文档中没有找到与"${question.slice(0, 50)}"直接相关的内容。请尝试上传更多文档，或换个方式提问。`,
        citations: [],
      };
    }

    // Build a smart mock response based on actual chunk content
    const citations = makeCitations(chunks, documents, Math.min(5, chunks.length));
    const docNames = [...new Set(chunks.map(c => documents.find(d => d.id === c.documentId)?.fileName || "未知"))].join("、");

    // Extract actual keywords from question
    const qWords = question.replace(/[?？,，。.！!]/g, "").split(/\s+/).filter(w => w.length > 1);

    // Build a contextual answer based on chunk content
    const relevantParts: string[] = [];
    for (const chunk of chunks.slice(0, 4)) {
      const doc = documents.find(d => d.id === chunk.documentId);
      // Find sentences in chunk that match question keywords
      const sentences = chunk.content.split(/[。.！!？?\n]/).filter(s => s.trim().length > 5);
      const matching = sentences.filter(s => qWords.some(w => s.includes(w)));
      if (matching.length > 0) {
        relevantParts.push(`来自《${doc?.fileName || "未知"}》${chunk.pageNumber ? `第${chunk.pageNumber}页` : ""}：${matching[0].trim()}`);
      } else if (sentences.length > 0) {
        relevantParts.push(`来自《${doc?.fileName || "未知"}》${chunk.pageNumber ? `第${chunk.pageNumber}页` : ""}：${sentences[0].trim()}`);
      }
    }

    const docSummary = `分析范围：${documents.length} 份文档（${docNames}），共 ${chunks.length} 个文本片段。\n\n`;
    const extracted = relevantParts.length > 0
      ? `根据文档内容提取的关键信息：\n\n${relevantParts.map((p, i) => `${i + 1}. ${p}`).join("\n\n")}\n\n`
      : "文档内容摘要：\n\n" + chunks.slice(0, 3).map((c, i) => {
          const doc = documents.find(d => d.id === c.documentId);
          return `${i + 1}. [《${doc?.fileName || "未知"}》] ${c.content.slice(0, 200)}...`;
        }).join("\n\n") + "\n\n";

    let analysis = "";
    if (documents.length >= 2) {
      analysis = `跨文档分析：\n\n这些文档从不同角度涉及了相关问题。上方引用展示了各文档的关键观点。请注意对比不同文档之间的异同，点击引用编号可查看原文出处。`;
    } else {
      analysis = `分析说明：\n\n以上内容根据文档原文提取。点击引用编号可跳转到出处原文进行验证。这是本地 Mock 分析结果，配置 DeepSeek API 可获得更深度的 AI 分析。`;
    }

    return {
      content: `关于"${question.slice(0, 80)}"\n\n${docSummary}${extracted}${analysis}`,
      citations,
    };
  }

  async streamChat(
    messages: { role: string; content: string }[],
    context?: { chunks: DocumentChunk[]; documents: Document[] },
    onChunk?: (text: string) => void
  ): Promise<{ content: string; citations: Citation[] }> {
    const result = await this.chat(messages, context);
    if (onChunk) {
      const words = result.content.split(" ");
      for (let i = 0; i < words.length; i++) {
        onChunk(words[i] + (i < words.length - 1 ? " " : ""));
        await new Promise((r) => setTimeout(r, 30));
      }
    }
    return result;
  }

  async summarize(
    document: Document,
    chunks: DocumentChunk[],
    mode: string
  ): Promise<{ content: string; citations: Citation[] }> {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
    const citations = makeCitations(chunks.slice(0, 3), [document], 3);
    const modeLabels: Record<string, string> = {
      quick: "Quick Summary",
      standard: "Standard Summary",
      deep: "Deep Analysis",
      exam: "Exam Review",
      requirement: "Requirements Summary",
      meeting: "Meeting Minutes",
    };
    return {
      content: `**${modeLabels[mode] || "Summary"} of "${document.fileName}"**

**One-sentence Summary:**
This document covers key information related to ${document.tags.join(", ") || "various topics"}.

**Core Points:**
${chunks.slice(0, 5).map((c, i) => `${i + 1}. ${c.content.slice(0, 120)}...`).join("\n")}

**Key Data:**
- Document: ${document.wordCount} words, ${document.pageCount} pages
- Topics: ${document.keywords.slice(0, 5).join(", ")}`,
      citations,
    };
  }

  async compareDocuments(
    documents: Document[],
    relevantChunks: DocumentChunk[][]
  ): Promise<{ content: string; citations: Citation[] }> {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000));
    const allChunks = relevantChunks.flat();
    const citations = makeCitations(allChunks, documents, Math.min(5, allChunks.length));
    return {
      content: `**Multi-Document Comparison**
Comparing ${documents.length} documents:
${documents.map((d) => `- ${d.fileName} (${d.wordCount} words, ${d.pageCount} pages)`).join("\n")}

**Common Keywords:**
${documents.flatMap((d) => d.keywords).filter((k, i, arr) => arr.indexOf(k) === i).slice(0, 5).map((k, i) => `${i + 1}. ${k}`).join("\n")}

**Analysis:** The documents share common ground in their objectives but differ in implementation details and assumptions.`,
      citations,
    };
  }

  async detectConflicts(
    _documentIds: string[],
    documents: Document[],
    chunks: DocumentChunk[]
  ): Promise<ConflictItem[]> {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1200));

    // Return demo-like conflicts when documents match
    if (documents.length >= 2) {
      return [
        {
          id: generateId(),
          topic: "实施时间线",
          level: "high",
          type: "data",
          documents: documents.slice(0, 2).map((d, i) => ({
            documentId: d.id,
            documentName: d.fileName,
            viewpoint: i === 0 ? "预估需要14周完成" : "预估需要12周完成",
            evidence: chunks.filter((c) => c.documentId === d.id).slice(0, 1).map((c) => c.content.slice(0, 150)).join(" "),
            pageNumber: chunks.find((c) => c.documentId === d.id)?.pageNumber,
          })),
          aiAnalysis: `两份文档给出了不同的时间线估计。"${documents[0].fileName}"建议更长的周期，而"${documents[1].fileName}"提出了更短的排期。这个差异值得进一步调查，以了解背后的假设条件。`,
          suggestedVerification: "请对比详细的工作分解结构，并核实关于团队产能和项目范围的假设条件。",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          topic: "技术架构方案",
          level: "medium",
          type: "methodology",
          documents: documents.slice(0, 2).map((d, i) => ({
            documentId: d.id,
            documentName: d.fileName,
            viewpoint: i === 0 ? "全栈方案，采用传统后端和数据库" : "轻量级前端配合边缘计算",
            evidence: `两份方案的架构选择存在差异。`,
            pageNumber: 1,
          })),
          aiAnalysis: "两份文档的底层架构思路存在显著差异。这是一个战略性的决策点，将直接影响开发成本、维护复杂度和未来的可扩展性。",
          suggestedVerification: "请根据具体项目需求，评估两种架构方案：数据持久化需求、离线能力、可扩展性要求及团队技术储备。",
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return [];
  }

  async generateConsensusTopics(
    _documentIds: string[],
    documents: Document[],
    _chunks: DocumentChunk[]
  ): Promise<ConsensusTopic[]> {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000));

    if (documents.length >= 2) {
      return [
        {
          id: generateId(),
          topic: "前端技术选型",
          level: "strong",
          description: "两份文档均同意使用 React 作为主要前端框架，表明团队在前端技术栈上已达成一致。",
          supportingDocuments: documents.slice(0, 2).map((d) => ({
            documentId: d.id,
            documentName: d.fileName,
            excerpt: `使用 React 作为前端框架来构建用户界面。`,
          })),
          opposingDocuments: [],
          coveragePercentage: 50,
        },
        {
          id: generateId(),
          topic: "隐私优先设计",
          level: "moderate",
          description: "多份文档均强调了本地文档处理和隐私保护的重要性。",
          supportingDocuments: documents.slice(0, 2).map((d) => ({
            documentId: d.id,
            documentName: d.fileName,
            excerpt: "强调了本地文档处理和数据隐私的必要性。",
          })),
          opposingDocuments: [],
          coveragePercentage: 50,
        },
      ];
    }
    return [];
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
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 1500));

    const citations = makeCitations(chunks.slice(0, 3), documents, 3);
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
          title: "一、问题定义",
          content: `本决策简报分析了 ${documents.length} 份文档，为以下决策提供支持：${params.title}。分析内容包括关键事实、共识与分歧领域，并给出基于证据的建议。`,
          citations,
          order: 1,
        },
        {
          id: generateId(),
          title: "二、关键事实",
          content: documents.map((d, i) => `${i + 1}. ${d.fileName}：${d.summary || "暂无摘要"}`).join("\n\n"),
          citations: [],
          order: 2,
        },
        {
          id: generateId(),
          title: "三、建议",
          content: `基于文档分析，提出以下建议。配置生产级 AI 模型（如 DeepSeek）可获得更详细、更贴合文档内容的具体建议。`,
          citations: [],
          order: 3,
        },
        {
          id: generateId(),
          title: "四、后续步骤",
          content: `1. 与利益相关方共同审视关键发现\n2. 在原始文档中核实关键数据点\n3. 补充已识别出的信息缺口\n4. 安排后续分析会议以解决未决问题`,
          citations: [],
          order: 4,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
