import { forwardRef, useMemo, useState } from 'react';
import { useT, tPlural } from '@/lib/i18n/useT';
import { useUIStore } from '@/store/uiStore';

interface JsonTreeViewerProps {
  source: string;
  /**
   * Called when the scroll container mounts (with the element) or unmounts
   * (with null). Used by App.tsx to bind the reading progress bar.
   */
  onScrollerReady?: (el: HTMLDivElement | null) => void;
}

type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

function parse(source: string): ParseResult {
  try {
    // Empty file → display as null
    if (!source.trim()) return { ok: true, value: null };
    return { ok: true, value: JSON.parse(source) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Parse error' };
  }
}

/**
 * Read-only tree view for JSON files with collapsible objects/arrays.
 *
 * We render directly from the parsed value rather than maintaining a heavy
 * tree-node model — recursion through plain JS values is fast enough for
 * typical config files (< 10K nodes) and avoids the complexity of a virtual
 * scroller. Very large JSON (~100K nodes) would lag, but that's a corner
 * case for a markdown viewer's secondary feature.
 *
 * State of which nodes are expanded lives at the top level: a Set of
 * "path strings" like "root.users[3].name". This keeps state flat,
 * serializable, and easy to bulk-update (expand all / collapse all).
 *
 * On initial render: root + top-level children are expanded; everything
 * deeper is collapsed. Most config files become immediately readable
 * this way.
 */
export const JsonTreeViewer = forwardRef<HTMLDivElement, JsonTreeViewerProps>(
  function JsonTreeViewer({ source, onScrollerReady }, ref) {
    const t = useT();
    const parsed = useMemo(() => parse(source), [source]);

    // initially expand root + first level
    const initialExpanded = useMemo(() => {
      const set = new Set<string>();
      set.add('$');
      if (parsed.ok && parsed.value && typeof parsed.value === 'object') {
        for (const key of Object.keys(parsed.value as object)) {
          set.add(`$.${key}`);
        }
      }
      return set;
    }, [parsed]);

    const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

    // Reset expanded paths when the source content changes (file reloaded,
    // user edited and came back to view). Use a key trick: useMemo above
    // recomputes initialExpanded → effect resets state.
    // Simpler: reset via React's pattern — re-derive expanded from initial
    // whenever source changes.
    useMemo(() => {
      setExpanded(initialExpanded);
    }, [initialExpanded]);

    const toggle = (path: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    };

    const expandAll = () => {
      if (!parsed.ok) return;
      const all = new Set<string>();
      collectAllPaths(parsed.value, '$', all);
      setExpanded(all);
    };

    const collapseAll = () => {
      setExpanded(new Set(['$']));
    };

    /*
     * Merged ref handler: forwards the DOM element to both the forwarded ref
     * (kept for backward compat) and the onScrollerReady callback. The
     * callback fires on mount AND unmount, giving App.tsx a reliable
     * signal even after rapid mode switches.
     */
    const setScrollerRef = (el: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
      onScrollerReady?.(el);
    };

    if (!parsed.ok) {
      return (
        <div ref={setScrollerRef} className="h-full overflow-y-auto">
          <div className="mx-auto max-w-2xl px-8 py-12">
            <div className="rounded-lg border border-red-400/30 bg-red-500/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-500">
                <AlertIcon />
                {t('json.invalid')}
              </div>
              <p className="text-sm text-muted">{t('json.invalid.hint')}</p>
              <pre className="mt-3 overflow-x-auto rounded bg-surface px-3 py-2 font-mono text-xs text-muted">
                {parsed.error}
              </pre>
              <button
                onClick={() => useUIStore.getState().setMode('edit')}
                className="mt-4 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {t('json.invalid.editButton')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={setScrollerRef} className="relative h-full overflow-y-auto">
        {/* Fold controls — positioned absolutely in the top-right corner
            of the viewer, matching the placement of CodeMirror's expand/
            collapse buttons in edit mode. Keeps the JSON content centred
            and the buttons in a consistent spot across view/edit. */}
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-1">
          <button
            onClick={expandAll}
            title={t('json.expandAll')}
            aria-label={t('json.expandAll')}
            className="pointer-events-auto flex h-7 items-center gap-1.5 rounded-md bg-surface/80 px-2 text-[11px] font-medium text-subtle shadow-soft backdrop-blur-sm transition-colors hover:bg-elevated hover:text-text"
          >
            <PlusIcon />
            <span className="whitespace-nowrap">{t('json.expandAll')}</span>
          </button>
          <button
            onClick={collapseAll}
            title={t('json.collapseAll')}
            aria-label={t('json.collapseAll')}
            className="pointer-events-auto flex h-7 items-center gap-1.5 rounded-md bg-surface/80 px-2 text-[11px] font-medium text-subtle shadow-soft backdrop-blur-sm transition-colors hover:bg-elevated hover:text-text"
          >
            <MinusIcon />
            <span className="whitespace-nowrap">{t('json.collapseAll')}</span>
          </button>
        </div>

        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="font-mono text-sm leading-relaxed">
            <Node
              value={parsed.value}
              path="$"
              propertyKey={null}
              expanded={expanded}
              toggle={toggle}
              isLast
            />
          </div>
        </div>
      </div>
    );
  },
);

/* ─── Recursive node ────────────────────────────────────────────────── */

interface NodeProps {
  value: unknown;
  path: string;
  /** key of this node inside its parent object; null for the root or array items */
  propertyKey: string | null;
  expanded: Set<string>;
  toggle: (path: string) => void;
  isLast: boolean;
}

function Node({ value, path, propertyKey, expanded, toggle, isLast }: NodeProps) {
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArr = Array.isArray(value);

  if (isObj || isArr) {
    return (
      <ContainerNode
        value={value as Record<string, unknown> | unknown[]}
        path={path}
        propertyKey={propertyKey}
        isArray={isArr}
        expanded={expanded}
        toggle={toggle}
        isLast={isLast}
      />
    );
  }
  return (
    <LeafNode
      value={value}
      propertyKey={propertyKey}
      isLast={isLast}
    />
  );
}

function ContainerNode({
  value,
  path,
  propertyKey,
  isArray,
  expanded,
  toggle,
  isLast,
}: {
  value: Record<string, unknown> | unknown[];
  path: string;
  propertyKey: string | null;
  isArray: boolean;
  expanded: Set<string>;
  toggle: (path: string) => void;
  isLast: boolean;
}) {
  const isOpen = expanded.has(path);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const count = entries.length;

  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';

  if (count === 0) {
    const emptyLabel = isArray ? 'json.empty.array' : 'json.empty.object';
    return (
      <div className="flex items-baseline gap-1">
        {propertyKey !== null && <PropertyKey k={propertyKey} />}
        <span className="text-subtle">
          {open}
          {close}
        </span>
        {!isLast && <span className="text-subtle">,</span>}
        <span className="ml-2 text-xs text-subtle">
          <EmptyHint kind={emptyLabel} />
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline gap-1">
        <button
          onClick={() => toggle(path)}
          className="-ml-4 flex h-4 w-4 shrink-0 items-center justify-center text-muted transition-transform hover:text-text"
          aria-label={isOpen ? 'collapse' : 'expand'}
        >
          {isOpen ? <ChevronDown /> : <ChevronRight />}
        </button>
        {propertyKey !== null && <PropertyKey k={propertyKey} />}
        <span className="text-subtle">{open}</span>
        {!isOpen && (
          <>
            <span className="text-subtle">…{close}</span>
            {!isLast && <span className="text-subtle">,</span>}
            <span className="ml-2 text-xs text-subtle">
              <CountHint count={count} />
            </span>
          </>
        )}
      </div>

      {isOpen && (
        <>
          <div className="ml-4 border-l border-border/50 pl-3">
            {entries.map(([k, v], i) => (
              <Node
                key={k}
                value={v}
                path={isArray ? `${path}[${k}]` : `${path}.${k}`}
                propertyKey={isArray ? null : k}
                expanded={expanded}
                toggle={toggle}
                isLast={i === entries.length - 1}
              />
            ))}
          </div>
          <div className="text-subtle">
            {close}
            {!isLast && ','}
          </div>
        </>
      )}
    </div>
  );
}

function LeafNode({
  value,
  propertyKey,
  isLast,
}: {
  value: unknown;
  propertyKey: string | null;
  isLast: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1">
      {propertyKey !== null && <PropertyKey k={propertyKey} />}
      <LeafValue value={value} />
      {!isLast && <span className="text-subtle">,</span>}
    </div>
  );
}

function PropertyKey({ k }: { k: string }) {
  return (
    <>
      <span className="text-accent">&quot;{k}&quot;</span>
      <span className="text-subtle">:</span>
    </>
  );
}

function LeafValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-muted italic">null</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="text-purple-500 dark:text-purple-400">{String(value)}</span>;
  }
  if (typeof value === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{String(value)}</span>;
  }
  if (typeof value === 'string') {
    return (
      <span className="text-green-700 dark:text-green-400 break-all">
        &quot;{value}&quot;
      </span>
    );
  }
  return <span className="text-muted">{String(value)}</span>;
}

function EmptyHint({ kind }: { kind: string }) {
  const t = useT();
  return <span>{t(kind)}</span>;
}

function CountHint({ count }: { count: number }) {
  return <span>{tPlural('json.items', count)}</span>;
}

/* ─── Icons ─────────────────────────────────────────────────────────── */

function ChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

function collectAllPaths(value: unknown, path: string, out: Set<string>): void {
  out.add(path);
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectAllPaths(v, `${path}[${i}]`, out));
  } else {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      collectAllPaths(v, `${path}.${k}`, out);
    }
  }
}
