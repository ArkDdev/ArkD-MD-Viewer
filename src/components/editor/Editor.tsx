import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { MaximizeIcon, PanelIcon } from '@/components/ui/Icons';
import { EditorToolbar } from './EditorToolbar';

export interface EditorHandle {
  getScroller: () => HTMLElement | null;
  getView: () => EditorView | null;
}

interface EditorProps {
  showPaneToggle?: boolean;
  isFull?: boolean;
}

/* ─── Highlight styles for both themes ─────────────────────────────── */

const lightHighlight = HighlightStyle.define([
  { tag: t.heading1, color: '#262420', fontWeight: '700' },
  { tag: t.heading2, color: '#262420', fontWeight: '700' },
  { tag: t.heading3, color: '#262420', fontWeight: '700' },
  { tag: [t.heading4, t.heading5, t.heading6], color: '#262420', fontWeight: '600' },
  { tag: t.strong, color: '#262420', fontWeight: '700' },
  { tag: t.emphasis, color: '#262420', fontStyle: 'italic' },
  { tag: t.link, color: '#C76D46', textDecoration: 'underline' },
  { tag: t.url, color: '#6E695F' },
  { tag: t.monospace, color: '#A0522D', backgroundColor: 'rgba(199,109,70,0.08)' },
  { tag: t.processingInstruction, color: '#A59E91' },
  { tag: t.contentSeparator, color: '#A59E91' },
  { tag: t.list, color: '#262420' },
  { tag: t.quote, color: '#6E695F', fontStyle: 'italic' },
  { tag: t.keyword, color: '#7C4A1F' },
  { tag: t.string, color: '#3F6E3F' },
  { tag: t.comment, color: '#A59E91', fontStyle: 'italic' },
]);

const darkHighlight = HighlightStyle.define([
  { tag: t.heading1, color: '#F5E8D8', fontWeight: '700' },
  { tag: t.heading2, color: '#F5E8D8', fontWeight: '700' },
  { tag: t.heading3, color: '#F5E8D8', fontWeight: '700' },
  { tag: [t.heading4, t.heading5, t.heading6], color: '#EBE6DC', fontWeight: '600' },
  { tag: t.strong, color: '#F5E8D8', fontWeight: '700' },
  { tag: t.emphasis, color: '#EBE6DC', fontStyle: 'italic' },
  { tag: t.link, color: '#E89E74', textDecoration: 'underline' },
  { tag: t.url, color: '#A59E91' },
  { tag: t.monospace, color: '#E89E74', backgroundColor: 'rgba(232,158,116,0.10)' },
  { tag: t.processingInstruction, color: '#807766' },
  { tag: t.contentSeparator, color: '#807766' },
  { tag: t.list, color: '#EBE6DC' },
  { tag: t.quote, color: '#A59E91', fontStyle: 'italic' },
  { tag: t.keyword, color: '#E89E74' },
  { tag: t.string, color: '#A8C99B' },
  { tag: t.comment, color: '#807766', fontStyle: 'italic' },
]);

const baseTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'rgb(var(--bg))',
    color: 'rgb(var(--text))',
  },
  '&.cm-focused': {
    outline: 'none !important',
  },
  '.cm-content': {
    outline: 'none !important',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    padding: '16px 0',
    caretColor: 'rgb(var(--accent))',
  },
  '.cm-scroller': {
    overflow: 'auto',
    outline: 'none !important',
  },
  '.cm-editor': {
    outline: 'none !important',
  },
  '.cm-editor.cm-focused': {
    outline: 'none !important',
  },
  '.cm-gutters': {
    backgroundColor: 'rgb(var(--bg))',
    color: 'rgb(var(--subtle))',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgb(var(--surface) / 0.5)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'rgb(var(--muted))',
  },
  '.cm-cursor': {
    borderLeftColor: 'rgb(var(--accent))',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'rgb(var(--accent) / 0.18) !important',
  },
});

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { showPaneToggle, isFull },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const highlightCompartment = useRef(new Compartment());
  const initialContent = useFileStore.getState().content;

  const themeOverride = useUIStore((s) => s.themeOverride);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const isDark = themeOverride === 'dark' || (themeOverride === null && systemDark);

  useImperativeHandle(
    ref,
    () => ({
      getScroller: () =>
        (hostRef.current?.querySelector('.cm-scroller') as HTMLElement) ?? null,
      getView: () => viewRef.current,
    }),
    [],
  );

  useEffect(() => {
    if (!hostRef.current) return;

    const initialHighlight = isDark ? darkHighlight : lightHighlight;

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        history(),
        lineNumbers(),
        highlightActiveLine(),
        markdown(),
        highlightCompartment.current.of(syntaxHighlighting(initialHighlight)),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            useFileStore.getState().setContent(update.state.doc.toString());
          }
        }),
        baseTheme,
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    /*
     * Sync editor with external store changes.
     *
     * Two cases trigger a doc replacement:
     *
     *   1. filePath changed → user opened a different file
     *      Replace the entire doc and place cursor at start.
     *
     *   2. content changed in store but NOT via the editor itself.
     *      Detected by comparing store.content to the editor's current text.
     *      If they differ, an external source updated the store (file watcher,
     *      "Reload" from conflict banner, etc.) and we need to mirror it.
     *      If they match, the change came from the editor's own update listener
     *      (typing) and there's nothing to do — no infinite loop.
     */
    const unsub = useFileStore.subscribe((s, prev) => {
      const view = viewRef.current;
      if (!view) return;

      // Case 1: file changed
      if (s.filePath !== prev.filePath) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: s.content },
          selection: { anchor: 0 },
        });
        return;
      }

      // Case 2: content changed externally (store ≠ editor)
      const editorContent = view.state.doc.toString();
      if (s.content !== editorContent) {
        // Preserve cursor position as best we can — clamp to new length
        const oldAnchor = view.state.selection.main.anchor;
        const newAnchor = Math.min(oldAnchor, s.content.length);
        view.dispatch({
          changes: { from: 0, to: editorContent.length, insert: s.content },
          selection: { anchor: newAnchor },
        });
      }
    });

    return () => {
      unsub();
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: highlightCompartment.current.reconfigure(
        syntaxHighlighting(isDark ? darkHighlight : lightHighlight),
      ),
    });
  }, [isDark]);

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar viewRef={viewRef} />
      <div className="relative min-h-0 flex-1">
        <div ref={hostRef} className="h-full" />

        {showPaneToggle && (
          <button
            onClick={() => useUIStore.getState().togglePreview()}
            aria-label={isFull ? 'Показать превью' : 'Скрыть превью'}
            title={isFull ? 'Показать превью' : 'Скрыть превью'}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-elevated/90 text-muted shadow-soft backdrop-blur-sm transition-colors hover:bg-elevated hover:text-text"
          >
            {isFull ? <PanelIcon /> : <MaximizeIcon />}
          </button>
        )}
      </div>
    </div>
  );
});
