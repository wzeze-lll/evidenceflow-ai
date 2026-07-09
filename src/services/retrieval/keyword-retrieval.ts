import type { DocumentChunk } from "@/types";

/**
 * Simple TF-IDF inspired keyword retrieval.
 * For production, this could be replaced with BM25 or vector-based semantic search.
 */
export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
}

export function retrieveRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 5
): RetrievalResult[] {
  if (!query.trim() || chunks.length === 0) return [];

  const queryTerms = tokenize(query.toLowerCase());

  // Calculate document frequency for IDF approximation
  const docFreq: Record<string, number> = {};
  for (const chunk of chunks) {
    const terms = new Set(tokenize(chunk.content.toLowerCase()));
    for (const term of terms) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }

  const N = chunks.length;
  const results: RetrievalResult[] = [];

  for (const chunk of chunks) {
    const chunkTerms = tokenize(chunk.content.toLowerCase());
    let score = 0;

    for (const qTerm of queryTerms) {
      // Term frequency in chunk
      const tf = chunkTerms.filter((t) => t === qTerm).length / Math.max(1, chunkTerms.length);

      // IDF-like weighting
      const df = docFreq[qTerm] || 1;
      const idf = Math.log((N + 1) / (df + 1)) + 1;

      score += tf * idf;

      // Bonus for exact phrase match
      if (chunk.content.toLowerCase().includes(query.toLowerCase())) {
        score += 0.5;
      }
    }

    // Bonus for keyword overlap
    const chunkKeywords = new Set(chunk.keywords || []);
    for (const term of queryTerms) {
      if (chunkKeywords.has(term)) {
        score += 0.3;
      }
    }

    if (score > 0) {
      results.push({ chunk, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];

  // Split by whitespace and punctuation
  const parts = text.split(/[\s,.;:!?()\[\]{}"'，。！？；：、""''《》【】\n\r\t]+/).filter(Boolean);

  for (const part of parts) {
    // For pure Chinese text (no spaces), use bigram tokenization
    if (/^[一-鿿]+$/.test(part) && part.length >= 2) {
      for (let i = 0; i < part.length - 1; i++) {
        tokens.push(part.slice(i, i + 2));
      }
      if (part.length >= 1) tokens.push(part);
    } else {
      // For mixed or English text, use as-is
      tokens.push(part);
    }
  }

  return tokens.filter(t => t.length > 0);
}

/**
 * Search chunks by keyword for document-level search.
 */
export function searchChunksByKeyword(query: string, chunks: DocumentChunk[]): RetrievalResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  return chunks
    .filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q)) ||
        (c.sectionTitle && c.sectionTitle.toLowerCase().includes(q))
    )
    .map((chunk) => ({
      chunk,
      score: calculateSimpleScore(q, chunk),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

function calculateSimpleScore(query: string, chunk: DocumentChunk): number {
  let score = 0;
  const content = chunk.content.toLowerCase();
  const q = query.toLowerCase();

  // Count occurrences
  let pos = 0;
  let count = 0;
  while ((pos = content.indexOf(q, pos)) !== -1) {
    count++;
    pos += q.length;
  }
  score += count * 2;

  // Title match bonus
  if (chunk.sectionTitle?.toLowerCase().includes(q)) {
    score += 10;
  }

  // Keyword match bonus
  if (chunk.keywords.some((k) => k.toLowerCase().includes(q))) {
    score += 5;
  }

  return score;
}
