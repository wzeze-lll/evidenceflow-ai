import Dexie, { type Table } from "dexie";
import type {
  Document,
  DocumentChunk,
  Workspace,
  AnalysisProject,
  AIConversation,
  Claim,
  Evidence,
  ConflictItem,
  ConsensusTopic,
  DecisionBrief,
  KnowledgeCard,
  UserSettings,
  ActivityLog,
} from "@/types";

export class EvidenceFlowDB extends Dexie {
  documents!: Table<Document, string>;
  chunks!: Table<DocumentChunk, string>;
  workspaces!: Table<Workspace, string>;
  projects!: Table<AnalysisProject, string>;
  conversations!: Table<AIConversation, string>;
  claims!: Table<Claim, string>;
  evidences!: Table<Evidence, string>;
  conflicts!: Table<ConflictItem, string>;
  consensusTopics!: Table<ConsensusTopic, string>;
  briefs!: Table<DecisionBrief, string>;
  knowledgeCards!: Table<KnowledgeCard, string>;
  settings!: Table<UserSettings, string>;
  activityLogs!: Table<ActivityLog, string>;

  constructor() {
    super("EvidenceFlowDB");

    this.version(1).stores({
      documents: "id, workspaceId, fileType, parseStatus, createdAt, tags",
      chunks: "id, documentId, position",
      workspaces: "id, isDemo",
      projects: "id, workspaceId, status",
      conversations: "id, documentId, projectId",
      claims: "id, conversationId",
      evidences: "id, claimId, citationId, documentId",
      conflicts: "id",
      consensusTopics: "id",
      briefs: "id, projectId",
      knowledgeCards: "id, documentId",
      settings: "id",
      activityLogs: "id, timestamp",
    });

    this.version(2).stores({
      documents: "id, workspaceId, fileType, parseStatus, createdAt, updatedAt, tags",
      chunks: "id, documentId, position",
      workspaces: "id, isDemo",
      projects: "id, workspaceId, status",
      conversations: "id, documentId, projectId",
      claims: "id, conversationId, createdAt",
      evidences: "id, claimId, citationId, documentId",
      conflicts: "id",
      consensusTopics: "id",
      briefs: "id, projectId, createdAt",
      knowledgeCards: "id, documentId",
      settings: "id",
      activityLogs: "id, timestamp",
    });
  }
}

export const db = new EvidenceFlowDB();
