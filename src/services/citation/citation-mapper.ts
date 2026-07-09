import type { Citation, DocumentChunk, Document } from "@/types";

/**
 * Maps citation IDs to their corresponding document chunks and source information.
 * This is the bridge between AI-generated citations and the UI evidence display.
 */
export interface ResolvedCitation {
  citation: Citation;
  chunk: DocumentChunk | null;
  document: Document | null;
  formattedLocation: string;
}

export function resolveCitation(
  citation: Citation,
  chunks: DocumentChunk[],
  documents: Document[]
): ResolvedCitation {
  const chunk = chunks.find((c) => c.id === citation.chunkId) || null;
  const document = documents.find((d) => d.id === citation.documentId) || null;

  const locationParts: string[] = [];
  if (document) locationParts.push(document.fileName);
  if (citation.pageNumber) locationParts.push(`Page ${citation.pageNumber}`);
  if (citation.sectionTitle) locationParts.push(citation.sectionTitle);

  return {
    citation,
    chunk,
    document,
    formattedLocation: locationParts.join(" > "),
  };
}

export function resolveCitations(
  citations: Citation[],
  chunks: DocumentChunk[],
  documents: Document[]
): ResolvedCitation[] {
  return citations.map((c) => resolveCitation(c, chunks, documents));
}

export function getRelationLabel(relation: string): string {
  const labels: Record<string, string> = {
    support: "支持",
    contradict: "反对",
    complement: "补充",
    uncertain: "不确定",
  };
  return labels[relation] || relation;
}

export function getRelationColor(relation: string): string {
  const colors: Record<string, string> = {
    support: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    contradict: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    complement: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    uncertain: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return colors[relation] || "bg-gray-100 text-gray-800";
}
