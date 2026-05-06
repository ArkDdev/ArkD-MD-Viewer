import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { useFileStore } from '@/store/fileStore';

export function Editor() {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialContent = useFileStore.getState().content;

  useEffect(() => {
    if (!hostRef.current) return;

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        history(),
        lineNumbers(),
        highlightActiveLine(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            useFileStore.getState().setContent(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            backgroundColor: 'rgb(var(--bg))',
            color: 'rgb(var(--text))',
          },
          '.cm-content': {
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            padding: '16px 0',
            caretColor: 'rgb(var(--accent))',
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
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    // Sync external file changes (e.g. opening a new file) into the editor
    const unsub = useFileStore.subscribe((s, prev) => {
      if (s.filePath !== prev.filePath && viewRef.current) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: s.content,
          },
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

  return <div ref={hostRef} className="h-full overflow-hidden" />;
}
