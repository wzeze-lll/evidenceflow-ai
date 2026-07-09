import { describe, it, expect } from "vitest";
import { cn, formatDate, formatFileSize, generateId, truncate } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("resolves Tailwind conflicts", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1048576)).toBe("1.0 MB");
  });
});

describe("generateId", () => {
  it("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
    expect(truncate("hi", 10)).toBe("hi");
  });
});

describe("formatDate", () => {
  it("formats date strings", () => {
    const result = formatDate("2026-07-09T09:00:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("07");
    expect(result).toContain("09");
  });
});
