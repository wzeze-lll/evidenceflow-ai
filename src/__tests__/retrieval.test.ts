import { describe, it, expect } from "vitest";
import { retrieveRelevantChunks, searchChunksByKeyword } from "@/services/retrieval/keyword-retrieval";
import type { DocumentChunk } from "@/types";

const makeChunk = (id: string, content: string, keywords: string[] = []): DocumentChunk => ({
  id,
  documentId: "doc-1",
  content,
  pageNumber: 1,
  sectionTitle: "Section 1",
  position: 0,
  keywords,
  createdAt: new Date().toISOString(),
});

describe("retrieveRelevantChunks", () => {
  const chunks = [
    makeChunk("c1", "React is a JavaScript library for building user interfaces", ["react", "javascript", "ui"]),
    makeChunk("c2", "TypeScript adds static typing to JavaScript", ["typescript", "javascript", "typing"]),
    makeChunk("c3", "Tailwind CSS is a utility-first CSS framework", ["tailwind", "css", "framework"]),
    makeChunk("c4", "Node.js runs JavaScript on the server side", ["nodejs", "javascript", "server"]),
  ];

  it("returns empty for empty query", () => {
    expect(retrieveRelevantChunks("", chunks)).toEqual([]);
  });

  it("returns empty for empty chunks", () => {
    expect(retrieveRelevantChunks("react", [])).toEqual([]);
  });

  it("finds relevant chunks by keyword", () => {
    const results = retrieveRelevantChunks("React library", chunks, 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.content).toContain("React");
  });

  it("respects topK limit", () => {
    const results = retrieveRelevantChunks("JavaScript", chunks, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("ranks exact matches higher", () => {
    const results = retrieveRelevantChunks("React", chunks, 2);
    expect(results[0].chunk.content).toContain("React");
    expect(results[0].score).toBeGreaterThan(0);
  });
});

describe("searchChunksByKeyword", () => {
  const chunks = [
    makeChunk("c1", "The project uses React and TypeScript", ["react", "typescript"]),
    makeChunk("c2", "Deployment is done via Docker", ["docker", "deployment"]),
  ];

  it("finds chunks by content", () => {
    const results = searchChunksByKeyword("React", chunks);
    expect(results.length).toBe(1);
    expect(results[0].chunk.id).toBe("c1");
  });

  it("finds chunks by keyword", () => {
    const results = searchChunksByKeyword("docker", chunks);
    expect(results.length).toBe(1);
    expect(results[0].chunk.id).toBe("c2");
  });

  it("returns empty for no match", () => {
    const results = searchChunksByKeyword("Python", chunks);
    expect(results).toEqual([]);
  });
});
