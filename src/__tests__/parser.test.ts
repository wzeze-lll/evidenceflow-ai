import { describe, it, expect } from "vitest";
import { parseFile } from "@/services/documents/parser";

describe("parseFile", () => {
  it("parses a simple text file", async () => {
    const content = "# 测试文档\n\n## 第一章\n这是第一章的内容。\n\n## 第二章\n这是第二章的内容，包含更多文字。";
    const file = new File([content], "test.txt", { type: "text/plain" });

    const result = await parseFile(file);

    expect(result.document.fileName).toBe("test.txt");
    expect(result.document.fileType).toBe("txt");
    expect(result.document.parseStatus).toBe("ready");
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks.some(c => c.content.includes("测试") || c.content.includes("第一章"))).toBe(true);
  });

  it("parses a markdown file with sections", async () => {
    const content = "# Title\n\n## Section A\nContent A here.\n\n## Section B\nContent B here.";
    const file = new File([content], "test.md", { type: "text/plain" });

    const result = await parseFile(file);

    expect(result.document.fileType).toBe("md");
    expect(result.chunks.length).toBeGreaterThanOrEqual(2);
    expect(result.chunks.some(c => c.sectionTitle === "Section A")).toBe(true);
  });

  it("rejects empty files", async () => {
    const file = new File([], "empty.txt", { type: "text/plain" });

    await expect(parseFile(file)).rejects.toThrow();
  });

  it("extracts keywords from content", async () => {
    const content = "React is a JavaScript library for building user interfaces. React uses components.";
    const file = new File([content], "react.txt", { type: "text/plain" });

    const result = await parseFile(file);

    expect(result.document.keywords.length).toBeGreaterThan(0);
    expect(result.document.keywords).toContain("react");
  });

  it("handles Chinese text", async () => {
    const content = "## 项目需求\n\n本项目需要支持多文档智能分析，包括PDF和Word文件的解析。";
    const file = new File([content], "需求.md", { type: "text/plain" });

    const result = await parseFile(file);

    expect(result.document.parseStatus).toBe("ready");
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.document.wordCount).toBeGreaterThan(0);
  });
});
