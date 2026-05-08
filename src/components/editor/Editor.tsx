import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { EditorState, Compartment, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { markdown } from '@codemirror/lang-markdown';
import {
  syntaxHighlighting,
  HighlightStyle,
  foldGutter,
  foldKeymap,
  foldAll,
  unfoldAll,
  indentOnInput,
  bracketMatching,
  StreamLanguage,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { tags as t, Tag } from '@lezer/highlight';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { useT } from '@/lib/i18n/useT';
import { MaximizeIcon, PanelIcon } from '@/components/ui/Icons';
import { EditorToolbar } from './EditorToolbar';
import { type FileCategory } from '@/lib/fs/fileType';

export interface EditorHandle {
  getScroller: () => HTMLElement | null;
  getView: () => EditorView | null;
}

interface EditorProps {
  showPaneToggle?: boolean;
  isFull?: boolean;
  readOnly?: boolean;
  showToolbar?: boolean;
  showFoldControls?: boolean;
  /**
   * Called when the editor's scroller element is mounted (with the element)
   * or unmounted (with null). The reading progress bar binds to this — using
   * a callback instead of a forwarded ref means the parent reliably learns
   * about both mount and unmount, even across rapid mode switches where
   * a forwardRef.current can otherwise be left pointing at a detached DOM
   * node (or null, with no signal to re-check).
   */
  onScrollerReady?: (el: HTMLElement | null) => void;
}

/* ─── Custom tags for config-style formats ─────────────────────────── */

/**
 * Stream-language modes (properties for INI, toml) emit token-type strings.
 * `properties` mode emits "header" for [section] lines and "def" for keys.
 *
 * The catch: `@codemirror/language`'s stream-parser has a built-in
 * `defaultTable` that *unconditionally* maps "header" → t.heading and
 * "def" → t.definition(t.variableName). The user-supplied `tokenTable` is
 * only consulted for token names that DON'T appear in defaultTable. So
 * `tokenTable: { header: ourTag }` is silently ignored.
 *
 * Workaround: wrap the mode's token() and rename the emitted strings to
 * names that don't collide with defaultTable. We use "configSection" and
 * "configKey" — unknown to the default mapping, so tokenTable picks them up.
 *
 * The downstream highlight style then targets our custom Tag instances
 * directly, decoupling config-format colours from markdown heading colours.
 */
const configSectionTag = Tag.define();
const configKeyTag = Tag.define();

const configTokenTable = {
  configSection: configSectionTag,
  configKey: configKeyTag,
};

/**
 * Wrap a StreamParser so its token() output gets the listed strings
 * remapped. The original parser is otherwise untouched (state, indent,
 * blankLine, etc. all forward as-is).
 *
 * This is the bridge between fixed legacy mode output ("header", "def")
 * and our token-table-friendly names ("configSection", "configKey").
 */
function withRemappedTokens<S>(parser: any, remap: Record<string, string>): any {
  const origToken = parser.token;
  return {
    ...parser,
    token(stream: any, state: S) {
      const result = origToken(stream, state);
      if (!result) return result;
      // Tokens can be space-separated lists ("foo bar"); remap each part.
      return result
        .split(' ')
        .map((part: string) => remap[part] ?? part)
        .join(' ');
    },
    tokenTable: { ...(parser.tokenTable || {}), ...configTokenTable },
  };
}

/* ─── Highlight styles ─────────────────────────────────────────────── */

/**
 * Safely build a HighlightStyle that survives missing tags in the installed
 * @lezer/highlight version. Different versions and parsers add/remove tag
 * exports, and HighlightStyle.define throws when it sees undefined as a
 * tag value. Filtering up-front keeps us forward-compatible: a missing tag
 * means we just don't style that token type, instead of crashing the editor.
 */
type SpecEntry = {
  tag: unknown;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  backgroundColor?: string;
};

function safeHighlight(entries: SpecEntry[]) {
  const valid = entries.filter((entry) => {
    const tag = entry.tag;
    if (tag === undefined || tag === null) return false;
    if (Array.isArray(tag) && tag.some((it) => it === undefined || it === null)) return false;
    return true;
  });
  // Cast: the entries match the runtime expectation of HighlightStyle.define
  // once we've filtered undefineds out.
  return HighlightStyle.define(valid as Parameters<typeof HighlightStyle.define>[0]);
}

const lightHighlight = safeHighlight([
  { tag: t.heading1, color: '#262420', fontWeight: '700' },
  { tag: t.heading2, color: '#262420', fontWeight: '700' },
  { tag: t.heading3, color: '#262420', fontWeight: '700' },
  { tag: [t.heading4, t.heading5, t.heading6], color: '#262420', fontWeight: '600' },
  { tag: t.heading, color: '#262420', fontWeight: '700' },
  { tag: t.strong, color: '#262420', fontWeight: '700' },
  { tag: t.emphasis, color: '#262420', fontStyle: 'italic' },
  { tag: t.link, color: '#C76D46', textDecoration: 'underline' },
  { tag: t.url, color: '#6E695F' },
  { tag: t.monospace, color: '#A0522D', backgroundColor: 'rgba(199,109,70,0.08)' },
  { tag: t.processingInstruction, color: '#A59E91' },
  { tag: t.contentSeparator, color: '#A59E91' },
  { tag: t.list, color: '#262420' },
  { tag: t.quote, color: '#6E695F', fontStyle: 'italic' },
  { tag: t.keyword, color: '#7C4A1F', fontWeight: '600' },
  { tag: t.string, color: '#3F6E3F' },
  { tag: t.number, color: '#1E5BA8' },
  { tag: t.bool, color: '#8B3FAE' },
  { tag: t.null, color: '#A59E91' },
  { tag: t.comment, color: '#A59E91', fontStyle: 'italic' },
  { tag: t.propertyName, color: '#C76D46', fontWeight: '500' },
  { tag: t.atom, color: '#8B3FAE' },
  { tag: t.tagName, color: '#C76D46', fontWeight: '600' },
  { tag: t.attributeName, color: '#7C4A1F' },
  { tag: t.attributeValue, color: '#3F6E3F' },
  // Config-format dedicated tags — INI/TOML section headers and keys.
  // Routed via tokenTable + token-name remapping in loadLanguage().
  //
  // Visual goal: match TOML's appearance for INI. TOML emits "atom" for
  // [section] (→ t.atom → purple bold) — we mirror that for configSection.
  // For keys (configKey) we use the same accent colour as t.propertyName
  // and explicitly clear any inherited italic styling, since some legacy
  // modes leak fontStyle through to values.
  { tag: configSectionTag, color: '#8B3FAE', fontWeight: '700', fontStyle: 'normal' },
  { tag: configKeyTag, color: '#C76D46', fontStyle: 'normal' },
  { tag: t.operator, color: '#6E695F' },
  { tag: t.punctuation, color: '#A59E91' },
  { tag: t.bracket, color: '#A59E91' },
]);

const darkHighlight = safeHighlight([
  { tag: t.heading1, color: '#F5E8D8', fontWeight: '700' },
  { tag: t.heading2, color: '#F5E8D8', fontWeight: '700' },
  { tag: t.heading3, color: '#F5E8D8', fontWeight: '700' },
  { tag: [t.heading4, t.heading5, t.heading6], color: '#EBE6DC', fontWeight: '600' },
  { tag: t.heading, color: '#F5E8D8', fontWeight: '700' },
  { tag: t.strong, color: '#F5E8D8', fontWeight: '700' },
  { tag: t.emphasis, color: '#EBE6DC', fontStyle: 'italic' },
  { tag: t.link, color: '#E89E74', textDecoration: 'underline' },
  { tag: t.url, color: '#A59E91' },
  { tag: t.monospace, color: '#E89E74', backgroundColor: 'rgba(232,158,116,0.10)' },
  { tag: t.processingInstruction, color: '#807766' },
  { tag: t.contentSeparator, color: '#807766' },
  { tag: t.list, color: '#EBE6DC' },
  { tag: t.quote, color: '#A59E91', fontStyle: 'italic' },
  { tag: t.keyword, color: '#E89E74', fontWeight: '600' },
  { tag: t.string, color: '#A8C99B' },
  { tag: t.number, color: '#7FB8E8' },
  { tag: t.bool, color: '#C99BD9' },
  { tag: t.null, color: '#807766' },
  { tag: t.comment, color: '#807766', fontStyle: 'italic' },
  { tag: t.propertyName, color: '#E89E74', fontWeight: '500' },
  { tag: t.atom, color: '#C99BD9' },
  { tag: t.tagName, color: '#E89E74', fontWeight: '600' },
  { tag: t.attributeName, color: '#A8C99B' },
  { tag: t.attributeValue, color: '#A8C99B' },
  { tag: configSectionTag, color: '#C99BD9', fontWeight: '700', fontStyle: 'normal' },
  { tag: configKeyTag, color: '#E89E74', fontStyle: 'normal' },
  { tag: t.operator, color: '#A59E91' },
  { tag: t.punctuation, color: '#807766' },
  { tag: t.bracket, color: '#807766' },
]);

function buildBaseTheme(fontSize: number) {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: `${fontSize}px`,
      backgroundColor: 'rgb(var(--bg))',
      color: 'rgb(var(--text))',
    },
    '&.cm-focused': { outline: 'none !important' },
    '.cm-content': {
      outline: 'none !important',
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
      padding: '16px 0',
      caretColor: 'rgb(var(--accent))',
    },
    '.cm-scroller': {
      overflow: 'auto',
      outline: 'none !important',
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    },
    '.cm-editor': { outline: 'none !important' },
    '.cm-editor.cm-focused': { outline: 'none !important' },
    '.cm-gutters': {
      backgroundColor: 'rgb(var(--bg))',
      color: 'rgb(var(--subtle))',
      border: 'none',
      paddingRight: '8px',
    },
    '.cm-foldGutter .cm-gutterElement': {
      cursor: 'pointer',
      padding: '0 4px',
      color: 'rgb(var(--subtle))',
    },
    '.cm-foldGutter .cm-gutterElement:hover': {
      color: 'rgb(var(--text))',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'rgb(var(--accent) / 0.15)',
      color: 'rgb(var(--accent))',
      border: 'none',
      borderRadius: '3px',
      padding: '0 4px',
      margin: '0 2px',
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
}

/* ─── Language loader ───────────────────────────────────────────────── */

const langCache = new Map<FileCategory, Extension>();

async function loadLanguage(category: FileCategory): Promise<Extension> {
  const cached = langCache.get(category);
  if (cached) return cached;

  let extension: Extension = [];

  switch (category) {
    case 'markdown': {
      extension = markdown();
      break;
    }
    case 'json':
    case 'json5': {
      const mod = await import('@codemirror/lang-json');
      extension = mod.json();
      break;
    }
    case 'yaml': {
      const mod = await import('@codemirror/lang-yaml');
      extension = mod.yaml();
      break;
    }
    case 'xml': {
      const mod = await import('@codemirror/lang-xml');
      extension = mod.xml();
      break;
    }
    case 'toml': {
      const mod = await import('@codemirror/legacy-modes/mode/toml');
      const remapped = withRemappedTokens(mod.toml, { header: 'configSection', def: 'configKey' });
      extension = StreamLanguage.define(remapped);
      break;
    }
    case 'ini': {
      // Hand-rolled INI parser — gives us full control over what tokens are
      // emitted, instead of fighting the legacy `properties` mode whose
      // value-tokens leaked through as `t.comment` (italic grey). This is
      // ~30 lines and lexically matches the INI format: section headers,
      // key=value pairs, comments (# and ;), and runs of strings/numbers/
      // booleans as values.
      //
      // Token names are designed to be either our remapped names (configSection,
      // configKey) or standard CodeMirror legacy names that map cleanly to
      // colourful tags (number, atom for booleans, string for everything else).
      extension = StreamLanguage.define({
        name: 'ini',
        token(stream) {
          // skip leading whitespace
          if (stream.eatSpace()) return null;

          // comments: ; or # to end of line
          if (stream.match(/^[;#].*/)) return 'comment';

          // [section] header — emits configSection (purple bold)
          if (stream.match(/^\[[^\]]*\]/)) return 'configSection';

          // key (everything up to = or :) — emits configKey (accent)
          // Only matched at line start, so values containing = aren't mis-keyed.
          if (stream.sol() && stream.match(/^[^=:\s][^=:]*?(?=\s*[=:])/)) {
            return 'configKey';
          }

          // separator
          if (stream.match(/^\s*[=:]\s*/)) return 'operator';

          // value side: classify by literal shape so we get good colours
          // (number, boolean, string).
          if (stream.match(/^(?:true|false|TRUE|FALSE|True|False|yes|no|on|off)(?=\s|[;#]|$)/)) {
            return 'atom';            // → t.atom → purple
          }
          // Number: digits and one optional decimal/exponent, but ONLY if
          // followed by whitespace / comment / end-of-line. The lookahead
          // is crucial: without it, "207.244.199.184" would match "207.244"
          // as a number, leaving ".199.184" to be parsed as a string —
          // breaking IP addresses, version strings (1.2.3), dates, etc.
          // With the lookahead, "207" alone won't match (because "." follows),
          // and the whole "207.244.199.184" falls through to the unquoted
          // string clause below.
          if (stream.match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?=\s|[;#]|$)/)) {
            return 'number';          // → t.number → blue
          }
          if (stream.match(/^"(?:[^"\\]|\\.)*"/)) {
            return 'string';          // → t.string → green
          }
          if (stream.match(/^'(?:[^'\\]|\\.)*'/)) {
            return 'string';
          }
          // unquoted string: everything up to end of line or comment
          if (stream.match(/^[^;#\n]+/)) {
            return 'string';
          }

          stream.next();
          return null;
        },
        languageData: {
          commentTokens: { line: '#' },
        },
        // tokenTable lets configSection/configKey route to our custom tags;
        // the rest (comment, atom, number, string, operator) fall through
        // to stream-parser's defaultTable mapping into standard Lezer tags.
        tokenTable: configTokenTable,
      });
      break;
    }
    case 'log':
    case 'csv':
    case 'tsv':
    case 'text':
    default:
      extension = [];
  }

  langCache.set(category, extension);
  return extension;
}

/* ─── Component ─────────────────────────────────────────────────────── */

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { showPaneToggle, isFull, readOnly = false, showToolbar = true, showFoldControls = false, onScrollerReady },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const t = useT();

  /*
   * CRITICAL: track programmatic updates so we don't mark the buffer dirty
   * when WE pushed new content into the editor (file load, watcher reload,
   * external source change). Without this guard, opening a fresh file
   * triggers updateListener → setContent → and even if values look equal,
   * CodeMirror normalises line endings (CRLF → LF), so `view.state.doc`
   * becomes != `originalContent`, and isDirty flips to true.
   *
   * Set the flag BEFORE dispatching the change, clear it AFTER. updateListener
   * checks this flag and skips the store write when it's true — the user
   * didn't actually edit anything.
   */
  const isProgrammaticUpdate = useRef(false);

  // Compartments
  const highlightCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const wrapCompartment = useRef(new Compartment());
  const langCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());

  const initialContent = useFileStore.getState().content;
  const initialCategory = useFileStore.getState().category;

  const themeOverride = useUIStore((s) => s.themeOverride);
  const editorFontSize = useUIStore((s) => s.editorFontSize);
  const editorWrap = useUIStore((s) => s.editorWrap);
  const category = useFileStore((s) => s.category);

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

  // Initial editor setup
  useEffect(() => {
    if (!hostRef.current) return;

    const initialHighlight = isDark ? darkHighlight : lightHighlight;
    const initialLang = initialCategory === 'markdown' ? markdown() : [];

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        history(),
        lineNumbers(),
        // foldGutter must be listed before the language so its gutter slot
        // is laid out correctly when the language adds syntactic fold info.
        foldGutter(),
        bracketMatching(),
        indentOnInput(),
        highlightActiveLine(),
        langCompartment.current.of(initialLang),
        closeBrackets(),
        highlightCompartment.current.of(syntaxHighlighting(initialHighlight)),
        themeCompartment.current.of(buildBaseTheme(editorFontSize)),
        wrapCompartment.current.of(editorWrap ? EditorView.lineWrapping : []),
        readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...foldKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          // Skip programmatic updates — they're echoes of store changes,
          // not user edits. Writing them back to the store would create
          // false dirty state and an infinite loop.
          if (isProgrammaticUpdate.current) return;
          useFileStore.getState().setContent(update.state.doc.toString());
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    // Notify the parent about our scroll container. We do this AFTER
    // EditorView.constructor returns — by that point the .cm-scroller
    // element is in the DOM. Using a callback (not a ref) means the parent
    // sees both mount and unmount events, which the reading progress bar
    // needs in order to re-attach its scroll listener after a mode switch.
    const scroller = hostRef.current.querySelector('.cm-scroller') as HTMLElement | null;
    onScrollerReady?.(scroller);

    // Load non-markdown language asynchronously
    if (initialCategory !== 'markdown') {
      loadLanguage(initialCategory).then((ext) => {
        if (viewRef.current === view) {
          view.dispatch({ effects: langCompartment.current.reconfigure(ext) });
        }
      });
    }

    /*
     * Sync store → editor (for file loads, watcher reloads, etc.).
     * Wraps each dispatch in the programmatic-update flag so we don't
     * accidentally mark the freshly-loaded buffer as dirty.
     */
    const unsub = useFileStore.subscribe((s, prev) => {
      const view = viewRef.current;
      if (!view) return;

      const dispatchProgrammatic = (changes: { from: number; to: number; insert: string }, selection?: { anchor: number }) => {
        isProgrammaticUpdate.current = true;
        try {
          view.dispatch({ changes, ...(selection ? { selection } : {}) });
        } finally {
          // Clear synchronously after dispatch — CodeMirror's updateListener
          // fires synchronously inside dispatch(), so the flag is still set
          // when our listener checks it.
          isProgrammaticUpdate.current = false;
        }
      };

      // File or load event changed → full replacement
      if (s.filePath !== prev.filePath || s.loadGeneration !== prev.loadGeneration) {
        dispatchProgrammatic(
          { from: 0, to: view.state.doc.length, insert: s.content },
          { anchor: 0 },
        );
        return;
      }

      // Watcher silent reload or external content sync
      const editorContent = view.state.doc.toString();
      if (s.content !== editorContent) {
        const oldAnchor = view.state.selection.main.anchor;
        const newAnchor = Math.min(oldAnchor, s.content.length);
        dispatchProgrammatic(
          { from: 0, to: editorContent.length, insert: s.content },
          { anchor: newAnchor },
        );
      }
    });

    return () => {
      unsub();
      // Tell the parent the scroller is going away — without this, the
      // progress bar would keep a reference to a detached DOM node.
      onScrollerReady?.(null);
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    loadLanguage(category).then((ext) => {
      if (viewRef.current) {
        viewRef.current.dispatch({ effects: langCompartment.current.reconfigure(ext) });
      }
    });
  }, [category]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: highlightCompartment.current.reconfigure(
        syntaxHighlighting(isDark ? darkHighlight : lightHighlight),
      ),
    });
  }, [isDark]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: themeCompartment.current.reconfigure(buildBaseTheme(editorFontSize)),
    });
  }, [editorFontSize]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: wrapCompartment.current.reconfigure(
        editorWrap ? EditorView.lineWrapping : [],
      ),
    });
  }, [editorWrap]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  // Whether folding actually applies to the current language. Plain text and
  // stream-language modes (ini/toml/log/csv) don't get syntactic fold ranges,
  // so the buttons would just do nothing. We hide them in that case.
  const hasFolding = category === 'json' || category === 'json5'
    || category === 'yaml' || category === 'xml';
  const showFolds = showFoldControls && hasFolding;

  return (
    <div className="flex h-full flex-col">
      {showToolbar && <EditorToolbar viewRef={viewRef} />}
      <div className="relative min-h-0 flex-1">
        <div ref={hostRef} className="h-full" />

        {showFolds && (
          <div className="absolute right-3 top-3 z-10 flex gap-1">
            <FoldButton
              kind="expand"
              onClick={() => {
                const view = viewRef.current;
                if (view) unfoldAll(view);
              }}
              label={t('json.expandAll')}
            />
            <FoldButton
              kind="collapse"
              onClick={() => {
                const view = viewRef.current;
                if (view) foldAll(view);
              }}
              label={t('json.collapseAll')}
            />
          </div>
        )}

        {showPaneToggle && (
          <button
            onClick={() => useUIStore.getState().togglePreview()}
            aria-label={isFull ? t('editor.showPreview') : t('editor.hidePreview')}
            title={isFull ? t('editor.showPreview') : t('editor.hidePreview')}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-elevated/90 text-muted shadow-soft backdrop-blur-sm transition-colors hover:bg-elevated hover:text-text"
          >
            {isFull ? <PanelIcon /> : <MaximizeIcon />}
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Compact "expand all / collapse all" button matching the ModeBadge style:
 * subtle rounded pill, tiny SVG icon, label. Designed to be unobtrusive in
 * the top-right of the editor area.
 */
function FoldButton({
  kind,
  onClick,
  label,
}: {
  kind: 'expand' | 'collapse';
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-7 items-center gap-1.5 rounded-md bg-surface/80 px-2 text-[11px] font-medium text-subtle shadow-soft backdrop-blur-sm transition-colors hover:bg-elevated hover:text-text"
    >
      {kind === 'expand' ? <ExpandIcon /> : <CollapseIcon />}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function ExpandIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
