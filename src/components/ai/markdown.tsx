"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * عارض Markdown لردود المساعد — يبني عناصر React فقط، بلا `dangerouslySetInnerHTML`:
 * نص الرد يأتي من نموذج لغوي، فلا يصل منه وسم HTML ولا رابط `javascript:` إلى الصفحة.
 *
 * يكفي ما يكتبه المساعد فعلًا: عناوين، فقرات، قوائم (مرقّمة ونقطية بمستويين)، اقتباس،
 * جداول، شيفرة، فاصل، وداخل السطر: عريض ومائل وشيفرة وروابط http(s).
 * كل كتلة `dir="auto"`: رد إنجليزي داخل لوحة عربية يُقرأ من اليسار.
 */

const SAFE_URL = /^https?:\/\//i;

function inline(text: string, key = "i"): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // ترتيب البدائل مهم: الشيفرة أولًا (ما داخلها لا يُفسَّر)، ثم الروابط، ثم العريض، ثم المائل
  const re = /(`[^`\n]+`)|(\[[^\]\n]+\]\((https?:\/\/[^)\s]+)\))|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*|_[^_\n]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<code key={k} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]" dir="ltr">{m[1].slice(1, -1)}</code>);
    else if (m[2]) {
      const label = m[2].slice(1, m[2].indexOf("]("));
      const href = m[3];
      out.push(SAFE_URL.test(href)
        ? <a key={k} href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-primary underline underline-offset-4">{label}</a>
        : label);
    } else if (m[4]) out.push(<strong key={k} className="font-semibold text-foreground">{inline(m[4].slice(2, -2), k)}</strong>);
    else if (m[5]) out.push(<em key={k}>{m[5].slice(1, -1)}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { t: "h"; level: number; text: string }
  | { t: "p"; text: string }
  | { t: "quote"; text: string }
  | { t: "code"; text: string }
  | { t: "hr" }
  | { t: "list"; ordered: boolean; items: { text: string; depth: number; n?: number }[] }
  | { t: "table"; head: string[]; rows: string[][] };

const LIST = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/;
const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.trimStart().startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) body.push(lines[i++]);
      i++;
      blocks.push({ t: "code", text: body.join("\n") });
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ t: "h", level: h[1].length, text: h[2].replace(/#+\s*$/, "") }); i++; continue; }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { blocks.push({ t: "hr" }); i++; continue; }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ t: "quote", text: body.join("\n") });
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cells(lines[i++]));
      blocks.push({ t: "table", head, rows });
      continue;
    }
    const lm = LIST.exec(line);
    if (lm) {
      const ordered = /\d/.test(lm[2]);
      const items: { text: string; depth: number; n?: number }[] = [];
      while (i < lines.length) {
        const m = LIST.exec(lines[i]);
        if (m) {
          items.push({ text: m[3], depth: m[1].length >= 2 ? 1 : 0, n: /\d/.test(m[2]) ? parseInt(m[2], 10) : undefined });
          i++;
        } else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) {
          items[items.length - 1].text += ` ${lines[i].trim()}`;
          i++;
        } else break;
      }
      blocks.push({ t: "list", ordered, items });
      continue;
    }
    const body: string[] = [];
    while (i < lines.length && lines[i].trim() && !LIST.exec(lines[i]) && !/^(#{1,4})\s/.test(lines[i]) && !lines[i].trimStart().startsWith("```") && !/^\s*>/.test(lines[i])) body.push(lines[i++]);
    blocks.push({ t: "p", text: body.join("\n") });
  }
  return blocks;
}

function withBreaks(text: string, key: string) {
  return text.split("\n").flatMap((l, j) => (j ? [<br key={`${key}-br${j}`} />, ...inline(l, `${key}-${j}`)] : inline(l, `${key}-${j}`)));
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = React.useMemo(() => parse(text), [text]);
  return (
    <div className={cn("space-y-3 text-sm leading-7 text-foreground/90 break-words", className)}>
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.t) {
          case "h": {
            const size = b.level <= 2 ? "text-base" : "text-sm";
            return <p key={k} dir="auto" role="heading" aria-level={b.level + 1} className={cn("pt-1 font-semibold text-foreground", size)}>{inline(b.text, k)}</p>;
          }
          case "p":
            return <p key={k} dir="auto">{withBreaks(b.text, k)}</p>;
          case "quote":
            return <blockquote key={k} dir="auto" className="border-s-2 border-primary/50 bg-muted/40 px-4 py-2 text-foreground/85">{withBreaks(b.text, k)}</blockquote>;
          case "code":
            return <pre key={k} dir="ltr" className="overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs leading-6">{b.text}</pre>;
          case "hr":
            return <hr key={k} className="border-border" />;
          case "table":
            return (
              <div key={k} className="overflow-x-auto rounded-lg border">
                <table className="w-full text-start text-xs" dir="auto">
                  <thead className="bg-muted/60"><tr>{b.head.map((c, j) => <th key={j} className="px-3 py-2 text-start font-semibold">{inline(c, `${k}h${j}`)}</th>)}</tr></thead>
                  <tbody>{b.rows.map((r, ri) => <tr key={ri} className="border-t">{r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{inline(c, `${k}r${ri}${j}`)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            );
          case "list":
            return (
              <ul key={k} dir="auto" className="space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className={cn("flex gap-2.5", it.depth && "ms-6")}>
                    {b.ordered && it.depth === 0 ? (
                      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-medium tabular-nums text-muted-foreground">{it.n ?? j + 1}</span>
                    ) : (
                      <span className={cn("mt-[0.7rem] shrink-0 rounded-full bg-muted-foreground/50", it.depth ? "size-1" : "size-1.5")} />
                    )}
                    <span className="min-w-0">{inline(it.text, `${k}l${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
}
