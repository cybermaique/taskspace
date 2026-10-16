// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  extractHashtags,
  parseBlocks,
  previewText,
  RichText,
  toPlainText,
} from "@/components/rich-text";

describe("parseBlocks", () => {
  it("splits text and fenced code blocks", () => {
    const blocks = parseBlocks("Antes\n```json\n{\"a\":1}\n```\nDepois");
    expect(blocks).toEqual([
      { type: "text", content: "Antes" },
      { type: "code", language: "json", content: "{\"a\":1}" },
      { type: "text", content: "Depois" },
    ]);
  });

  it("treats unknown fences as generic code", () => {
    expect(parseBlocks("```\nconst a = 1\n```")[0]).toMatchObject({ type: "code", language: "code" });
  });
});

describe("text helpers", () => {
  it("extracts unique, lowercased hashtags including accents", () => {
    expect(extractHashtags("#Ideia e #ideia #ação #dev-ops")).toEqual(["#ideia", "#ação", "#dev-ops"]);
  });

  it("strips code fences for clipboard copies", () => {
    expect(toPlainText("Rode:\n```code\nnpm test\n```")).toBe("Rode:\nnpm test");
  });

  it("builds a single-line preview without code", () => {
    expect(previewText("Linha 1\n```json\n{}\n```\nLinha 2")).toBe("Linha 1 ⟨código⟩ Linha 2");
    expect(previewText("x".repeat(30), 10)).toBe(`${"x".repeat(10)}…`);
  });
});

describe("<RichText />", () => {
  it("renders links, named shortcuts and highlighted tags", () => {
    render(<RichText content={"Docs > nextjs.org\nVer https://example.com/a. #api"} activeTag="#api" />);

    expect(screen.getByRole("link", { name: "Docs" })).toHaveProperty("href", "https://nextjs.org/");
    expect(screen.getByRole("link", { name: "example.com/a" })).toHaveProperty(
      "href",
      "https://example.com/a",
    );
    // Tags are text, not controls: filtering lives in the tag chips.
    expect(screen.queryByRole("button", { name: "#api" })).toBeNull();
    expect(screen.getByText("#api").className).toContain("bg-brand-soft");
  });

  it("opens external links safely", () => {
    render(<RichText content="https://example.com" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});
