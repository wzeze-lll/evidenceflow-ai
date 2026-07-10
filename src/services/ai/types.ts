import type { Citation, ConflictItem, ConsensusTopic, DecisionBrief, Document, DocumentChunk } from "@/types";

export interface AIProvider {
  readonly name: string;
  readonly id: string;
  /** Set when the provider is a fallback (e.g. Mock due to missing API key) */
  readonly warningMessage?: string;
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
  { id: "mock", name: "模拟演示", type: "mock", needsKey: false, needsBaseUrl: false },
  { id: "deepseek", name: "DeepSeek", type: "deepseek", needsKey: true, needsBaseUrl: false },
  { id: "openai", name: "OpenAI", type: "openai", needsKey: true, needsBaseUrl: false },
  { id: "groq", name: "Groq", type: "groq", needsKey: true, needsBaseUrl: false },
  { id: "gemini", name: "Google Gemini", type: "gemini", needsKey: true, needsBaseUrl: false },
  { id: "mistral", name: "Mistral AI", type: "mistral", needsKey: true, needsBaseUrl: false },
  { id: "together", name: "Together AI", type: "together", needsKey: true, needsBaseUrl: false },
  { id: "qwen", name: "通义千问", type: "qwen", needsKey: true, needsBaseUrl: false },
  { id: "glm", name: "智谱 GLM", type: "glm", needsKey: true, needsBaseUrl: false },
  { id: "moonshot", name: "月之暗面 Kimi", type: "moonshot", needsKey: true, needsBaseUrl: false },
  { id: "siliconflow", name: "硅基流动", type: "siliconflow", needsKey: true, needsBaseUrl: false },
  { id: "custom", name: "自定义接口", type: "custom", needsKey: true, needsBaseUrl: true },
];
