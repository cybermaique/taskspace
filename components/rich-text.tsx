"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Braces, Check, ChevronDown, Code2, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

type Block =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language: "code" | "json" };

const CODE_BLOCK_PATTERN = /```(json|code)?[ \t]*\r?\n([\s\S]*?)```/gi;
const INLINE_PATTERN = /(https?:\/\/[^\s<>"']+|#[\wÀ-ɏ-]+)/g;
// "Label > example.com" turns into a named link.
const SHORTCUT_PATTERN =
  /(^|\n)([^<>\n]+?)\s*>\s*((?:https?:\/\/|www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?:[/?#][^\s<>]*)?)(?=\s|$)/gim;
const MAX_VISIBLE_URL = 64;

export function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let cursor = 0;
  for (const match of content.matchAll(CODE_BLOCK_PATTERN)) {
    const text = content.slice(cursor, match.index).trim();
    if (text) blocks.push({ type: "text", content: text });
    blocks.push({
      type: "code",
      language: match[1]?.toLowerCase() === "json" ? "json" : "code",
      content: match[2].trim(),
    });
    cursor = (match.index ?? 0) + match[0].length;
  }
  const rest = content.slice(cursor).trim();
  if (rest) blocks.push({ type: "text", content: rest });
  return blocks.length ? blocks : [{ type: "text", content }];
}

/** Strips code fences so copied text pastes cleanly elsewhere. */
export function toPlainText(content: string) {
  return content.replace(/```[^\r\n]*\r?\n([\s\S]*?)```/g, "$1").trim();
}

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\wÀ-ɏ-]+/g) ?? [];
  return [...new Set(matches.map((tag) => tag.toLowerCase()))];
}

function splitTrailingPunctuation(value: string) {
  const match = /[.,;:!?\])}]+$/.exec(value);
  return match
    ? { url: value.slice(0, -match[0].length), trailing: match[0] }
    : { url: value, trailing: "" };
}

function shortenUrl(url: string) {
  const display = url.replace(/^https?:\/\/(www\.)?/, "");
  return display.length > MAX_VISIBLE_URL
    ? `${display.slice(0, 40)}…${display.slice(-18)}`
    : display;
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  );
}

function renderInline(
  text: string,
  key: string,
  activeTag?: string | null,
) {
  return text.split(INLINE_PATTERN).map((part, index) => {
    const partKey = `${key}-${index}`;
    if (/^https?:\/\//i.test(part)) {
      const { url, trailing } = splitTrailingPunctuation(part);
      return (
        <Fragment key={partKey}>
          <ExternalLink href={url}>{shortenUrl(url)}</ExternalLink>
          {trailing}
        </Fragment>
      );
    }
    if (/^#[\wÀ-ɏ-]+$/.test(part)) {
      const tag = part.toLowerCase();
      // Tags are highlighted inline; filtering happens through the tag chips.
      return (
        <span
          key={partKey}
          className={cn("font-medium text-primary", activeTag === tag && "rounded bg-brand-soft px-0.5")}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function renderText(text: string, key: string, activeTag?: string | null) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  for (const match of text.matchAll(SHORTCUT_PATTERN)) {
    const labelStart = (match.index ?? 0) + (match[1]?.length ?? 0);
    nodes.push(...renderInline(text.slice(cursor, labelStart), `${key}-p${index}`, activeTag));
    const { url, trailing } = splitTrailingPunctuation(match[3]);
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    nodes.push(
      <Fragment key={`${key}-s${index}`}>
        <ExternalLink href={href}>{match[2].trim()}</ExternalLink>
        {trailing}
      </Fragment>,
    );
    cursor = (match.index ?? 0) + match[0].length;
    index += 1;
  }
  nodes.push(...renderInline(text.slice(cursor), `${key}-r`, activeTag));
  return nodes;
}

function formatJson(content: string) {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return null;
  }
}

export function CodeBlock({
  content,
  language,
  collapsible = false,
}: {
  content: string;
  language: "code" | "json";
  collapsible?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(!collapsible);
  const formatted = language === "json" ? formatJson(content) : null;
  const code = formatted ?? content;
  const lines = code.split(/\r?\n/).length;
  const Icon = language === "json" ? Braces : Code2;

  return (
    <div className="overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100 dark:bg-black/40">
      <div className="flex h-9 items-center gap-2 border-b border-white/10 pr-1 pl-3 text-xs text-zinc-400">
        <Icon className="size-3.5" />
        <span className="font-medium text-zinc-300">
          {language === "json" ? (formatted ? "JSON" : "JSON inválido") : "Código"}
        </span>
        <span>· {lines} {lines === 1 ? "linha" : "linhas"}</span>
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="inline-flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-zinc-100"
            aria-label="Copiar código"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          {collapsible ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen((value) => !value);
              }}
              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-zinc-100"
              aria-label={open ? "Recolher código" : "Expandir código"}
              aria-expanded={open}
            >
              <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            </button>
          ) : null}
        </div>
      </div>
      {open ? (
        <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap">
          {code}
        </pre>
      ) : null}
    </div>
  );
}

export function RichText({
  content,
  className,
  collapsibleCode = false,
  activeTag,
}: {
  content: string;
  className?: string;
  collapsibleCode?: boolean;
  activeTag?: string | null;
}) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, index) =>
        block.type === "code" ? (
          <CodeBlock
            key={`code-${index}`}
            content={block.content}
            language={block.language}
            collapsible={collapsibleCode}
          />
        ) : (
          <p key={`text-${index}`} className="rich-text leading-relaxed">
            {renderText(block.content, `t${index}`, activeTag)}
          </p>
        ),
      )}
    </div>
  );
}

/** Single-line-friendly preview: no code blocks, links rendered as text. */
export function previewText(content: string, maxLength = 220) {
  const plain = content
    .replace(/```(?:json|code)?[ \t]*\r?\n[\s\S]*?```/gi, " ⟨código⟩ ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trimEnd()}…` : plain;
}
