import type { Citation, ConflictItem, ConsensusTopic, DecisionBrief, Document, DocumentChunk } from "@/types";

export interface AIProvider {
  readonly name: string;
  readonly id: string;
  testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }>;
  chat(
    messages: { role: string; content: string }[],
    context?: { chunks: DocumentChunk[]; documents: Document[] }
  ): Promise<{ content: string; citations: Citation[] }>;
  streamChat(
    messages: { role: string; content: string }[],
    context?: { chunks: DocumentChunk[]; documents: Document[] },
    onChunk?: (text: string) => void
  ): Promise<{ content: string; citations: Citation[] }>;
  summarize(document: Document, chunks: DocumentChunk[], mode: string): Promise<{ content: string; citations: Citation[] }>;
  compareDocuments(documents: Document[], relevantChunks: DocumentChunk[][]): Promise<{ content: string; citations: Citation[] }>;
  detectConflicts(documentIds: string[], documents: Document[], chunks: DocumentChunk[]): Promise<ConflictItem[]>;
  generateConsensusTopics(documentIds: string[], documents: Document[], chunks: DocumentChunk[]): Promise<ConsensusTopic[]>;
  generateDecisionBrief(
    params: { projectId: string; title: string; target: string; audience: string; detail: string },
    documents: Document[],
    chunks: DocumentChunk[]
  ): Promise<DecisionBrief>;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  type: string;
  needsKey: boolean;
  needsBaseUrl: boolean;
}

export const AI_PROVIDER_CONFIGS: AIProviderConfig[] = [
  { id: "mock", name: "Mock Demo Provider", type: "mock", needsKey: false, needsBaseUrl: false },
  { id: "openai", name: "OpenAI Compatible", type: "openai", needsKey: true, needsBaseUrl: false },
  { id: "deepseek", name: "DeepSeek Compatible", type: "deepseek", needsKey: true, needsBaseUrl: false },
  { id: "custom", name: "Custom OpenAI-Compatible", type: "custom", needsKey: true, needsBaseUrl: true },
];
