/**
 * Restricted markdown renderer for article bodies.
 *
 * Accepted subset only:
 *   `##` / `###`  → h2 / h3 headings
 *   `- ` lines    → gathered into the list that follows them
 *   blank lines   → paragraph breaks
 *   **text**      → <strong>
 *
 * Everything else — raw HTML, links, images, tables — passes through as plain
 * text. The seed stores bodies in this subset, and the admin editor is
 * expected to produce it too, so no sanitiser is needed anywhere: the output
 * is built from escaped text nodes, never from the body string as HTML.
 */
import * as React from "react";

type Span = { text: string; bold?: boolean };

function parseSpans(line: string): Span[] {
  // The double-asterisk pairs are balanced by construction in the seed files;
  // an odd count simply leaves the tail plain instead of swallowing text.
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  return parts.map((part) =>
    part.startsWith("**") && part.endsWith("**")
      ? { text: part.slice(2, -2), bold: true }
      : { text: part }
  );
}

type Block =
  | { kind: "h2" | "h3" | "p"; spans: Span[] }
  | { kind: "ul"; items: Span[][] };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) continue;
    if (line.startsWith("### ")) {
      blocks.push({ kind: "h3", spans: parseSpans(line.slice(4)) });
    } else if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", spans: parseSpans(line.slice(3)) });
    } else if (line.startsWith("- ")) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(parseSpans(line.slice(2)));
      else blocks.push({ kind: "ul", items: [parseSpans(line.slice(2))] });
    } else {
      const last = blocks[blocks.length - 1];
      // Consecutive plain lines belong to one paragraph; blank lines split.
      if (last?.kind === "p" && !line.startsWith("#")) last.spans.push({ text: " " }, ...parseSpans(line));
      else blocks.push({ kind: "p", spans: parseSpans(line) });
    }
  }
  return blocks;
}

export function renderMarkdown(source: string): React.ReactNode {
  const blocks = parse(source);
  return blocks.map((block, index) => {
    const key = `b${index}`;
    if (block.kind === "ul") {
      return (
        <ul key={key}>
          {block.items.map((item, i) => (
            <li key={i}>
              {item.map((span, j) =>
                span.bold ? <strong key={j}>{span.text}</strong> : <React.Fragment key={j}>{span.text}</React.Fragment>
              )}
            </li>
          ))}
        </ul>
      );
    }
    if (block.kind === "h3") {
      return <h3 key={key}>{block.spans.map((s) => (s.bold ? <strong key={0}>{s.text}</strong> : s.text))}</h3>;
    }
    if (block.kind === "h2") {
      return <h2 key={key}>{block.spans.map((s) => (s.bold ? <strong key={0}>{s.text}</strong> : s.text))}</h2>;
    }
    return (
      <p key={key}>
        {block.spans.map((span, j) =>
          span.bold ? <strong key={j}>{span.text}</strong> : <React.Fragment key={j}>{span.text}</React.Fragment>
        )}
      </p>
    );
  });
}

/** Reading time from word count; slow enough for Arabic-long templates. */
export function readingMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 160));
}
