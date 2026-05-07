import type { RefObject } from 'react';
import type { EditorView } from '@codemirror/view';

interface EditorToolbarProps {
  viewRef: RefObject<EditorView | null>;
}

/**
 * Markdown formatting toolbar.
 *
 * Inline wrappers (B, I, S, code) implement proper toggle:
 *   - If selection is wrapped in markers → unwrap (strip the markers)
 *   - If selection isn't wrapped but the immediate surrounding text is → unwrap
 *   - Otherwise → wrap
 *
 * Block-level prefixes (headings, lists, quotes) toggle by checking
 * whether the line already starts with the prefix.
 */
export function EditorToolbar({ viewRef }: EditorToolbarProps) {
  /**
   * Toggle an inline wrapper. Handles three cases:
   *  1) Selected text already starts with `before` and ends with `after` →
   *     remove them (selection contained the markers).
   *  2) The text immediately around the selection is the markers →
   *     remove them (markers outside the selection).
   *  3) Neither → wrap the selection.
   */
  const toggleWrap = (before: string, after: string = before) => () => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const doc = view.state.doc;
    const selected = doc.sliceString(from, to);

    // Case 1: selection already contains the wrappers at its edges
    if (selected.startsWith(before) && selected.endsWith(after) && selected.length >= before.length + after.length) {
      const inner = selected.slice(before.length, selected.length - after.length);
      view.dispatch({
        changes: { from, to, insert: inner },
        selection: { anchor: from, head: from + inner.length },
      });
      view.focus();
      return;
    }

    // Case 2: wrappers are immediately outside the selection
    const beforeStart = Math.max(0, from - before.length);
    const afterEnd = Math.min(doc.length, to + after.length);
    const leftCheck = doc.sliceString(beforeStart, from);
    const rightCheck = doc.sliceString(to, afterEnd);
    if (leftCheck === before && rightCheck === after) {
      view.dispatch({
        changes: [
          { from: beforeStart, to: from, insert: '' },
          { from: to, to: afterEnd, insert: '' },
        ],
        selection: { anchor: beforeStart, head: beforeStart + selected.length },
      });
      view.focus();
      return;
    }

    // Case 3: wrap
    const insert = before + selected + after;
    view.dispatch({
      changes: { from, to, insert },
      selection: {
        anchor: from + before.length,
        head: from + before.length + selected.length,
      },
    });
    view.focus();
  };

  /** Toggle a line-prefix marker (#, >, -, etc.) */
  const toggleLinePrefix = (prefix: string) => () => {
    const view = viewRef.current;
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const lineText = line.text;

    if (lineText.startsWith(prefix)) {
      view.dispatch({
        changes: { from: line.from, to: line.from + prefix.length, insert: '' },
      });
    } else {
      view.dispatch({
        changes: { from: line.from, insert: prefix },
      });
    }
    view.focus();
  };

  /** Insert a code block (```) skeleton with cursor inside */
  const insertCodeBlock = () => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const atLineStart = from === line.from;
    const prefix = atLineStart ? '' : '\n';
    const insert = prefix + '```\n\n```\n';
    // Cursor goes between the two lines of fences
    const cursor = from + prefix.length + 4; // length of '```\n'
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: cursor },
    });
    view.focus();
  };

  /** Insert a link with placeholder, selecting the URL part for quick replacement */
  const insertLink = () => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const text = selected || 'текст';
    const insert = `[${text}](url)`;
    view.dispatch({
      changes: { from, to, insert },
      selection: {
        anchor: from + text.length + 3,
        head: from + text.length + 6,
      },
    });
    view.focus();
  };

  return (
    <div className="flex h-9 shrink-0 items-center gap-0.5 border-b border-border bg-bg px-2">
      <ToolButton onClick={toggleWrap('**')} label="Жирный" hint="Ctrl+B">
        <span className="font-bold">B</span>
      </ToolButton>
      <ToolButton onClick={toggleWrap('*')} label="Курсив" hint="Ctrl+I">
        <span className="italic font-serif">I</span>
      </ToolButton>
      <ToolButton onClick={toggleWrap('~~')} label="Зачёркнутый">
        <span className="line-through">S</span>
      </ToolButton>
      <ToolButton onClick={toggleWrap('`')} label="Inline code">
        <CodeInlineIcon />
      </ToolButton>

      <Divider />

      <ToolButton onClick={toggleLinePrefix('# ')} label="Заголовок 1">
        <span className="text-[11px] font-semibold">H1</span>
      </ToolButton>
      <ToolButton onClick={toggleLinePrefix('## ')} label="Заголовок 2">
        <span className="text-[11px] font-semibold">H2</span>
      </ToolButton>
      <ToolButton onClick={toggleLinePrefix('### ')} label="Заголовок 3">
        <span className="text-[11px] font-semibold">H3</span>
      </ToolButton>

      <Divider />

      <ToolButton onClick={insertLink} label="Ссылка">
        <LinkIcon />
      </ToolButton>
      <ToolButton onClick={toggleLinePrefix('- ')} label="Список">
        <ListIcon />
      </ToolButton>
      <ToolButton onClick={toggleLinePrefix('> ')} label="Цитата">
        <QuoteIcon />
      </ToolButton>
      <ToolButton onClick={insertCodeBlock} label="Блок кода">
        <CodeBlockIcon />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  hint,
  children,
}: {
  onClick: () => void;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const title = hint ? `${label} (${hint})` : label;
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface hover:text-text"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-border" />;
}

/* ── Inline icons ──────────────────────────────────────────── */

function CodeInlineIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <polyline points="9 10 7 12 9 14" />
      <polyline points="15 10 17 12 15 14" />
    </svg>
  );
}
