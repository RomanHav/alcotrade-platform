"use client";

import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type RichTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (value: string) => void;
  toolbarClassName?: string;
  wrapperClassName?: string;
};

function surround(
  text: string,
  start: number,
  end: number,
  before: string,
  after: string,
) {
  const sel = text.slice(start, end);
  return text.slice(0, start) + before + sel + after + text.slice(end);
}

function toggleLinePrefix(text: string, start: number, end: number, prefix: string) {
  // Apply/remove prefix for each selected line
  const pre = text.slice(0, start);
  const sel = text.slice(start, end);
  const post = text.slice(end);
  const lines = sel.split(/\n/);
  const allPrefixed = lines.every((l) => l.startsWith(prefix) || l.trim() === "");
  const next = lines
    .map((l, i) => {
      if (!l.trim()) return l; // keep empty line
      if (allPrefixed) return l.startsWith(prefix) ? l.slice(prefix.length) : l;
      return prefix + l;
    })
    .join("\n");
  return pre + next + post;
}

function numberLines(text: string, start: number, end: number) {
  const pre = text.slice(0, start);
  const sel = text.slice(start, end);
  const post = text.slice(end);
  const lines = sel.split(/\n/);
  const isNumbered = lines.every((l) => /^\s*\d+\.\s/.test(l) || l.trim() === "");
  const next = lines
    .map((l, idx) => {
      if (!l.trim()) return l;
      if (isNumbered) return l.replace(/^\s*\d+\.\s/, "");
      return `${idx + 1}. ${l}`;
    })
    .join("\n");
  return pre + next + post;
}

function applyHeading(text: string, start: number, end: number, level: 1 | 2 | 3) {
  const marker = "#".repeat(level) + " ";
  const pre = text.slice(0, start);
  const sel = text.slice(start, end);
  const post = text.slice(end);
  const lines = sel.split(/\n/);
  const next = lines
    .map((l) => {
      if (!l.trim()) return l;
      // remove any existing leading ###* once, then apply target
      const cleared = l.replace(/^\s{0,3}#{1,6}\s+/, "");
      return marker + cleared;
    })
    .join("\n");
  return pre + next + post;
}

function applyQuote(text: string, start: number, end: number) {
  return toggleLinePrefix(text, start, end, "> ");
}

function applyCode(text: string, start: number, end: number) {
  const sel = text.slice(start, end);
  const isMulti = sel.includes("\n");

  if (isMulti) {
    // Check if already in code block
    const before = text.slice(Math.max(0, start - 4), start);
    const after = text.slice(end, Math.min(text.length, end + 4));

    if (before === '```\n' && after === '\n```') {
      return text.slice(0, start - 4) + sel + text.slice(end + 4);
    }

    return surround(text, start, end, "```\n", "\n```\n");
  }

  // Check if already in inline code
  const before = text.slice(Math.max(0, start - 1), start);
  const after = text.slice(end, Math.min(text.length, end + 1));

  if (before === '`' && after === '`') {
    return text.slice(0, start - 1) + sel + text.slice(end + 1);
  }

  // If selection starts/ends with `, remove them
  if (sel.startsWith('`') && sel.endsWith('`') && sel.length > 2) {
    const inner = sel.slice(1, -1);
    return text.slice(0, start) + inner + text.slice(end);
  }

  return surround(text, start, end, "`", "`");
}

function applyStrong(text: string, start: number, end: number) {
  // Check if the selection is already wrapped in ** markers
  const before = text.slice(Math.max(0, start - 2), start);
  const after = text.slice(end, Math.min(text.length, end + 2));
  const sel = text.slice(start, end);

  // If selection is already bold, remove the markers
  if (before === '**' && after === '**') {
    return text.slice(0, start - 2) + sel + text.slice(end + 2);
  }

  // If selection starts/ends with **, remove them and don't add new ones
  if (sel.startsWith('**') && sel.endsWith('**')) {
    const inner = sel.slice(2, -2);
    return text.slice(0, start) + inner + text.slice(end);
  }

  // Otherwise, add bold markers
  return surround(text, start, end, "**", "**");
}

function applyEm(text: string, start: number, end: number) {
  // Check if the selection is already wrapped in * markers
  const before = text.slice(Math.max(0, start - 1), start);
  const after = text.slice(end, Math.min(text.length, end + 1));
  const sel = text.slice(start, end);

  // If selection is already italic, remove the markers
  if (before === '*' && after === '*') {
    return text.slice(0, start - 1) + sel + text.slice(end + 1);
  }

  // If selection starts/ends with *, remove them and don't add new ones
  if (sel.startsWith('*') && sel.endsWith('*') && sel.length > 2) {
    const inner = sel.slice(1, -1);
    return text.slice(0, start) + inner + text.slice(end);
  }

  // Otherwise, add italic markers
  return surround(text, start, end, "*", "*");
}

function applyUnderline(text: string, start: number, end: number) {
  // Check if the selection is already wrapped in __ markers
  const before = text.slice(Math.max(0, start - 2), start);
  const after = text.slice(end, Math.min(text.length, end + 2));
  const sel = text.slice(start, end);

  // If selection is already underlined, remove the markers
  if (before === '__' && after === '__') {
    return text.slice(0, start - 2) + sel + text.slice(end + 2);
  }

  // If selection starts/ends with __, remove them and don't add new ones
  if (sel.startsWith('__') && sel.endsWith('__')) {
    const inner = sel.slice(2, -2);
    return text.slice(0, start) + inner + text.slice(end);
  }

  // Otherwise, add underline markers
  return surround(text, start, end, "__", "__");
}

function insertDivider(text: string, pos: number) {
  const before = text.slice(0, pos);
  const after = text.slice(pos);
  const insert = (before.endsWith("\n") ? "" : "\n") + "---\n";
  return before + insert + after;
}

function applyLink(text: string, start: number, end: number) {
  const sel = text.slice(start, end);
  const urlLike = /^(https?:\/\/|www\.)/i.test(sel.trim());
  const label = urlLike ? "Ссылка" : sel || "Текст ссылки";
  const url = urlLike ? sel.trim() : (typeof window !== "undefined" ? window.prompt("URL:", "https://") ?? "https://" : "https://");
  const display = label || "Ссылка";
  const href = url && url.trim() ? url.trim() : "https://";
  const md = `[${display}](${href})`;
  return text.slice(0, start) + md + text.slice(end);
}

function insertEmoji(text: string, pos: number, emoji: string) {
  return text.slice(0, pos) + emoji + text.slice(pos);
}

export const RichTextarea = forwardRef<HTMLTextAreaElement, RichTextareaProps>(
  ({ className, wrapperClassName, toolbarClassName, value, onChange, ...props }, ref) => {
    const areaRef = useRef<HTMLTextAreaElement | null>(null);

    const bindRef = useCallback(
      (el: HTMLTextAreaElement | null) => {
        areaRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      },
      [ref],
    );

    const runEdit = useCallback(
      (fn: (text: string, start: number, end: number) => string) => {
        const el = areaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const next = fn(value, start, end);
        onChange(next);
        // попытка умно восстановить курсор — ставим после вставленного блока
        requestAnimationFrame(() => {
          const delta = next.length - value.length;
          const pos = Math.max(0, Math.min(next.length, end + delta));
          try {
            el.setSelectionRange(pos, pos);
            el.focus();
          } catch {}
        });
      },
      [value, onChange],
    );

    const runInsertAtCaret = useCallback(
      (fn: (text: string, pos: number) => string) => {
        const el = areaRef.current;
        if (!el) return;
        const pos = el.selectionStart ?? value.length;
        const next = fn(value, pos);
        onChange(next);
        requestAnimationFrame(() => {
          const delta = next.length - value.length;
          const caret = Math.max(0, Math.min(next.length, pos + delta));
          try {
            el.setSelectionRange(caret, caret);
            el.focus();
          } catch {}
        });
      },
      [value, onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle Enter key for paragraphs
        if (e.key === 'Enter') {
          e.preventDefault();
          const el = areaRef.current;
          if (!el) return;

          const start = el.selectionStart;
          const end = el.selectionEnd;
          const text = value;

          // Check if we're at the end of the text or there's selected text
          if (start === end) {
            // Simple Enter - add a new line
            const before = text.slice(0, start);
            const after = text.slice(start);
            const newText = before + '\n' + after;
            onChange(newText);

            requestAnimationFrame(() => {
              el.setSelectionRange(start + 1, start + 1);
            });
          } else {
            // Text is selected - replace with new line
            const before = text.slice(0, start);
            const after = text.slice(end);
            const newText = before + '\n' + after;
            onChange(newText);

            requestAnimationFrame(() => {
              el.setSelectionRange(start + 1, start + 1);
            });
          }
          return;
        }

        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case 'b':
              e.preventDefault();
              runEdit(applyStrong);
              break;
            case 'i':
              e.preventDefault();
              runEdit(applyEm);
              break;
            case 'u':
              e.preventDefault();
              runEdit(applyUnderline);
              break;
            case '`':
              e.preventDefault();
              runEdit(applyCode);
              break;
          }
        }
      },
      [value, onChange, runEdit],
    );

    const toolbar = useMemo(() => (
      <div className={cn("flex flex-wrap items-center gap-1 border-b p-1", toolbarClassName)}>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Heading 1" onClick={() => runEdit((t, s, e) => applyHeading(t, s, e, 1))}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Heading 2" onClick={() => runEdit((t, s, e) => applyHeading(t, s, e, 2))}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Heading 3" onClick={() => runEdit((t, s, e) => applyHeading(t, s, e, 3))}>
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Bold" onClick={() => runEdit(applyStrong)}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Italic" onClick={() => runEdit(applyEm)}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Underline" onClick={() => runEdit(applyUnderline)}>
            <Underline className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Code" onClick={() => runEdit(applyCode)}>
            <Code className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Quote" onClick={() => runEdit(applyQuote)}>
            <Quote className="h-4 w-4" />
          </Button>
        </div>
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Bulleted list" onClick={() => runEdit((t, s, e) => toggleLinePrefix(t, s, e, "- "))}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Numbered list" onClick={() => runEdit(numberLines)}>
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Link" onClick={() => runEdit(applyLink)}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Divider" onClick={() => runInsertAtCaret(insertDivider)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Emoji" onClick={() => runInsertAtCaret((t, p) => insertEmoji(t, p, "😊"))}>
            <Smile className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ), [runEdit, runInsertAtCaret, toolbarClassName]);

    return (
      <div className={cn("rounded-md border bg-neutral-200 dark:bg-neutral-800", wrapperClassName)}>
        {toolbar}
        <Textarea ref={bindRef} className={cn("border-0 shadow-none focus-visible:ring-0", className)} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} {...props} />
      </div>
    );
  },
);

RichTextarea.displayName = "RichTextarea";

export default RichTextarea;
