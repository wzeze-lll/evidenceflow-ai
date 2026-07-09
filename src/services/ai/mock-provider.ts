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

  async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return { ok: true, message: "Mock provider is always available", latencyMs: 350 };
  }

  async chat(
    messages: { role: string; content: string }[],
    context?: { chunks: DocumentChunk[]; documents: Document[] }
  ): Promise<{ content: string; citations: Citation[] }> {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 800));
    const chunks = context?.chunks || [];
    const documents = context?.documents || [];
    const lastMsg = messages.filter((m) => m.role === "user").pop();
    const question = lastMsg?.content || "";

    const citations = makeCitations(chunks, documents, Math.min(3, chunks.length));

    let answer: string;
    if (chunks.length === 0) {
      answer = `I couldn't find directly relevant information in the current documents to answer: "${question.slice(0, 100)}"

**Suggestions:**
1. Try uploading additional documents that may contain relevant information
2. Rephrase your question to focus on topics covered in the available documents
3. Check if the documents have been fully parsed`;
    } else {
      const findings = chunks.slice(0, 3).map((c, i) => `${i + 1}. ${c.content.slice(0, 150)}...`).join("\n");
      answer = `Based on the provided documents, here is my analysis regarding: "${question.slice(0, 100)}"

**Key Findings:**
${findings}

**Analysis:**
The documents provide insights that help address this question. The cited excerpts above contain the most relevant information. Please review the source documents for complete context.`;
    }

    return { content: answer, citations };
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
          topic: "Implementation Timeline",
          level: "high",
          type: "data",
          documents: documents.slice(0, 2).map((d, i) => ({
            documentId: d.id,
            documentName: d.fileName,
            viewpoint: i === 0 ? "Estimated 14 weeks for completion" : "Estimated 12 weeks for completion",
            evidence: chunks.filter((c) => c.documentId === d.id).slice(0, 1).map((c) => c.content.slice(0, 150)).join(" "),
            pageNumber: chunks.find((c) => c.documentId === d.id)?.pageNumber,
          })),
          aiAnalysis: `The two documents present different timeline estimates. "${documents[0].fileName}" suggests a longer timeline, while "${documents[1].fileName}" proposes a shorter schedule. This discrepancy should be investigated to understand the underlying assumptions.`,
          suggestedVerification: "Compare detailed work breakdown structures and verify underlying assumptions about team capacity and scope.",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          topic: "Technical Architecture Approach",
          level: "medium",
          type: "methodology",
          documents: documents.slice(0, 2).map((d, i) => ({
            documentId: d.id,
            documentName: d.fileName,
            viewpoint: i === 0 ? "Full-stack with traditional backend and database" : "Lightweight frontend with edge computing",
            evidence: `Architecture choice differs between the two proposals.`,
            pageNumber: 1,
          })),
          aiAnalysis: "The fundamental architectural approaches differ significantly. This represents a strategic decision point that will affect development cost, maintenance complexity, and future scalability.",
          suggestedVerification: "Evaluate both architectures against specific project requirements: data persistence needs, offline capability, scalability requirements, and team expertise.",
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
          topic: "Frontend Technology Choice",
          level: "strong",
          description: "Both documents agree on using React as the primary frontend framework, indicating team alignment on the frontend technology stack.",
          supportingDocuments: documents.slice(0, 2).map((d) => ({
            documentId: d.id,
            documentName: d.fileName,
            excerpt: `Uses React as the frontend framework for building the user interface.`,
          })),
          opposingDocuments: [],
          coveragePercentage: 50,
        },
        {
          id: generateId(),
          topic: "Privacy-First Design",
          level: "moderate",
          description: "Multiple documents emphasize the importance of local document processing and privacy protection.",
          supportingDocuments: documents.slice(0, 2).map((d) => ({
            documentId: d.id,
            documentName: d.fileName,
            excerpt: "Emphasizes the need for local document processing and data privacy.",
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
          title: "I. Problem Definition",
          content: `This decision brief analyzes ${documents.length} documents to support decision-making for: ${params.title}. The analysis examines key facts, areas of consensus and conflict, and provides evidence-based recommendations.`,
          citations,
          order: 1,
        },
        {
          id: generateId(),
          title: "II. Key Facts",
          content: documents.map((d, i) => `${i + 1}. ${d.fileName}: ${d.summary || "No summary available"}`).join("\n\n"),
          citations: [],
          order: 2,
        },
        {
          id: generateId(),
          title: "III. Recommendations",
          content: `Based on the document analysis, the following recommendations are made. Configure a production AI provider for more detailed, context-specific recommendations tailored to your documents.`,
          citations: [],
          order: 3,
        },
        {
          id: generateId(),
          title: "IV. Next Steps",
          content: `1. Review key findings with stakeholders\n2. Verify critical data points across source documents\n3. Address identified information gaps\n4. Schedule follow-up analysis for any unresolved questions`,
          citations: [],
          order: 4,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
