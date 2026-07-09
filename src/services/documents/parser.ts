import type { Document, DocumentChunk, DocumentType } from "@/types";
import { generateId } from "@/lib/utils";

function getDocumentType(fileName: string): DocumentType {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "pdf";
    case "docx": case "doc": return "docx";
    case "md": case "markdown": return "md";
    default: return "txt";
  }
}

function splitIntoSections(text: string): { title: string; content: string; pageNumber: number }[] {
  const lines = text.split("\n");
  const sections: { title: string; content: string; pageNumber: number }[] = [];
  let currentTitle = "";
  let currentContent = "";
  let pageNum = 1;

  for (const line of lines) {
    // Detect markdown headings
    if (/^#{1,3}\s/.test(line)) {
      if (currentContent.trim()) {
        sections.push({ title: currentTitle || "正文", content: currentContent.trim(), pageNumber: pageNum });
      }
      currentTitle = line.replace(/^#{1,3}\s*/, "").trim();
      currentContent = "";
      continue;
    }
    // Split on empty lines (paragraph boundary) for better chunking
    if (line.trim() === "" && currentContent.length > 200) {
      sections.push({ title: currentTitle || "正文", content: currentContent.trim(), pageNumber: pageNum });
      currentContent = "";
      pageNum++;
      continue;
    }
    currentContent += line + "\n";
    // Split large chunks at reasonable size
    if (currentContent.length > 800) {
      sections.push({ title: currentTitle || "正文", content: currentContent.trim(), pageNumber: pageNum });
      currentContent = "";
      pageNum++;
    }
  }
  if (currentContent.trim()) {
    sections.push({ title: currentTitle || "正文", content: currentContent.trim(), pageNumber: pageNum });
  }
  if (sections.length === 0 && text.trim()) {
    // Force-split large text into smaller chunks
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += 800) {
      chunks.push(text.slice(i, i + 800).trim());
    }
    return chunks.filter(c => c).map((c, i) => ({
      title: "正文",
      content: c,
      pageNumber: Math.floor(i / 2) + 1,
    }));
  }
  return sections;
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/[\s,.;:!?()\[\]{}"'\n\r\t]+/).filter(Boolean);
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "and", "but", "or", "not", "no", "this", "that", "these", "those",
    "it", "its", "的", "是", "在", "了", "和", "与", "或", "不",
  ]);
  const freq: Record<string, number> = {};
  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9一-鿿]/g, "");
    if (cleaned.length >= 2 && !stopWords.has(cleaned)) {
      freq[cleaned] = (freq[cleaned] || 0) + 1;
    }
  }
  return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 10).map(([w]) => w);
}

/**
 * Extract text from a PDF file using pdfjs-dist.
 * Falls back with a clear error message if the PDF cannot be read (e.g. scanned images).
 */
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Configure the worker — use CDN for the matching pdfjs-dist version
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(" ");
    pages.push(pageText);
  }

  const fullText = pages.join("\n").trim();

  if (!fullText) {
    throw new Error(
      "此 PDF 无法提取文本内容，可能是扫描版图片 PDF。请使用包含可选文本的 PDF，或转换为 TXT/Markdown 格式。"
    );
  }

  return fullText;
}

export async function parseFile(file: File): Promise<{ document: Document; chunks: DocumentChunk[] }> {
  const fileType = getDocumentType(file.name);

  try {
    let text: string;

    if (fileType === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = await import("mammoth");
      const extracted = await mammoth.extractRawText({ arrayBuffer });
      text = extracted.value;
    } else if (fileType === "pdf") {
      text = await extractPdfText(file);
    } else {
      // TXT, MD, and other plain-text formats
      text = await file.text();
    }

    if (!text.trim()) {
      throw new Error("无法从文件中提取文本内容。请确认文件不是扫描版或空文件。");
    }

    const sections = splitIntoSections(text);
    const words = text.split(/[\s,.;:!?()\[\]{}"'\n\r\t]+/).filter(Boolean);
    const docId = generateId();
    const now = new Date().toISOString();

    const document: Document = {
      id: docId,
      workspaceId: "",
      fileName: file.name,
      fileType,
      fileSize: file.size,
      pageCount: Math.max(1, sections.length),
      wordCount: words.length,
      parseStatus: "ready",
      tags: [],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      summary: text.slice(0, 200).replace(/\n/g, " "),
      keywords: extractKeywords(text),
      chunkCount: sections.length,
    };

    const chunks: DocumentChunk[] = sections.map((section, i) => ({
      id: `${docId}-chunk-${i}`,
      documentId: docId,
      content: section.content.slice(0, 5000),
      pageNumber: section.pageNumber,
      sectionTitle: section.title,
      position: i,
      keywords: extractKeywords(section.content),
      createdAt: now,
    }));

    return { document, chunks };
  } catch (err) {
    if (err instanceof Error && err.message.includes("无法从文件")) {
      throw err;
    }
    throw new Error(`解析失败：${err instanceof Error ? err.message : "未知错误"}`);
  }
}
