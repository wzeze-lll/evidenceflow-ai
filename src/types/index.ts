// ============================================================
// Core Domain Types for EvidenceFlow AI
// ============================================================

export type DocumentType = "pdf" | "docx" | "txt" | "md";
export type ParseStatus = "pending" | "parsing" | "ready" | "error";
export type EvidenceRelation = "support" | "contradict" | "complement" | "uncertain";
export type ConflictType = "data" | "definition" | "opinion" | "timeline" | "methodology";
export type ConflictLevel = "high" | "medium" | "low";
export type ConsensusLevel = "strong" | "moderate" | "weak" | "contested";
export type BriefTarget = "project_evaluation" | "study_summary" | "requirement_review" | "report_comparison" | "research_analysis";
export type BriefAudience = "self" | "team" | "stakeholder" | "executive";
export type BriefDetail = "concise" | "standard" | "comprehensive";

// ---- Document ----
export interface Document {
  id: string;
  workspaceId: string;
  fileName: string;
  fileType: DocumentType;
  fileSize: number;
  pageCount: number;
  wordCount: number;
  parseStatus: ParseStatus;
  parseError?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  summary?: string;
  keywords: string[];
  chunkCount: number;
}

// ---- DocumentChunk ----
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  pageNumber?: number;
  sectionTitle?: string;
  position: number;
  keywords: string[];
  createdAt: string;
}

// ---- Workspace ----
export interface Workspace {
  id: string;
  name: string;
  description: string;
  documentIds: string[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- AnalysisProject ----
export interface AnalysisProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  documentIds: string[];
  status: "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

// ---- AI Entities ----
export interface AIConversation {
  id: string;
  documentId?: string;
  projectId?: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Citation[];
  createdAt: string;
}

export interface Citation {
  id: string;
  chunkId: string;
  documentId: string;
  documentName: string;
  text: string;
  pageNumber?: number;
  sectionTitle?: string;
  relation: EvidenceRelation;
  relevanceScore: number;
}

// ---- Evidence Chain ----
export interface Claim {
  id: string;
  conversationId: string;
  content: string;
  confidence: "high" | "medium" | "low" | "unverified";
  evidenceCount: number;
  supportCount: number;
  contradictCount: number;
  createdAt: string;
}

export interface Evidence {
  id: string;
  claimId?: string;
  citationId: string;
  documentId: string;
  documentName: string;
  text: string;
  pageNumber?: number;
  sectionTitle?: string;
  relation: EvidenceRelation;
  note?: string;
  createdAt: string;
}

// ---- Conflict Radar ----
export interface ConflictItem {
  id: string;
  topic: string;
  level: ConflictLevel;
  type: ConflictType;
  documents: { documentId: string; documentName: string; viewpoint: string; evidence: string; pageNumber?: number }[];
  aiAnalysis: string;
  suggestedVerification: string;
  createdAt: string;
}

// ---- Consensus Map ----
export interface ConsensusTopic {
  id: string;
  topic: string;
  level: ConsensusLevel;
  description: string;
  supportingDocuments: { documentId: string; documentName: string; excerpt: string }[];
  opposingDocuments: { documentId: string; documentName: string; excerpt: string }[];
  coveragePercentage: number;
}

// ---- Decision Brief ----
export interface DecisionBrief {
  id: string;
  projectId: string;
  title: string;
  target: BriefTarget;
  audience: BriefAudience;
  detail: BriefDetail;
  sections: BriefSection[];
  createdAt: string;
  updatedAt: string;
}

export interface BriefSection {
  id: string;
  title: string;
  content: string;
  citations: Citation[];
  order: number;
}

// ---- Knowledge Card ----
export interface KnowledgeCard {
  id: string;
  documentId: string;
  type: "concept" | "qa" | "key_point" | "evidence";
  front: string;
  back: string;
  familiarity: number;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
}

// ---- User Settings ----
export interface UserSettings {
  theme: "light" | "dark" | "system";
  aiProvider: "mock" | "openai" | "deepseek" | "qwen" | "glm" | "moonshot" | "siliconflow" | "custom";
  aiApiKey: string;
  aiBaseUrl: string;
  aiModel: string;
  language: "zh" | "en";
  fontSize: "small" | "medium" | "large";
}

// ---- Activity Log ----
export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  timestamp: string;
  details?: string;
}
