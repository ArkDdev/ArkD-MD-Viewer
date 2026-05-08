import { forwardRef, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { renderMarkdown } from '@/lib/markdown/parser';
import { highlightCode } from '@/lib/highlight/shiki';
import { useUIStore, resolveTheme } from '@/store/uiStore';

interface RendererProps {
  source: string;
  onScroll?: (e: UIEvent<HTMLDivElement>) => void;
  /**
   * Called when the renderer's scroll container mounts (with the element)
   * or unmounts (with null). Used by App.tsx to bind the reading progress
   * bar to the right scroller, even after mode switches that swap the
   * underlying DOM node.
   */
  onScrollerReady?: (el: HTMLDivElement | null) => void;
}

function displayLang(lang: string | undefined): string | null {
  if (!lang || lang === 'text' || lang === 'plain') return null;
  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    rb: 'ruby',
    sh: 'shell',
    yml: 'yaml',
  };
  return aliases[lang.toLowerCase()] ?? lang.toLowerCase();
}

const FONT_FAMILY_CLASS = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
} as const;

const FONT_SIZE_CLASS = {
  sm: 'text-reader-sm',
  base: 'text-reader-base',
  lg: 'text-reader-lg',
  xl: 'text-reader-xl',
} as const;

const LINE_HEIGHT_VALUE = {
  compact: '1.5',
  normal: '1.7',
  relaxed: '1.9',
} as const;

const WIDTH_CLASS = {
  narrow: 'max-w-reader-narrow',
  medium: 'max-w-reader-medium',
  wide: 'max-w-reader-wide',
  full: 'max-w-full',
} as const;

export const Renderer = forwardRef<HTMLDivElement, RendererProps>(
  function Renderer({ source, onScroll, onScrollerReady }, ref) {
    const {
      readerFontFamily,
      readerFontSize,
      readerLineHeight,
      readerWidth,
      themeOverride,
    } = useUIStore();
    const articleRef = useRef<HTMLElement>(null);
    const theme = resolveTheme(themeOverride);

    const [systemDark, setSystemDark] = useState(
      () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    );
    useEffect(() => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }, []);
    const effectiveDark = themeOverride === 'dark' || (themeOverride === null && systemDark);

    const html = useMemo(() => renderMarkdown(source), [source]);

    useEffect(() => {
      const root = articleRef.current;
      if (!root) return;

      const blocks = root.querySelectorAll<HTMLElement>('pre > code[class*="language-"]');
      let cancelled = false;

      blocks.forEach(async (codeEl) => {
        const langMatch = codeEl.className.match(/language-([\w-]+)/);
        const lang = langMatch?.[1];
        const code = codeEl.textContent ?? '';

        try {
          const highlighted = await highlightCode(code, lang, effectiveDark);
          if (cancelled) return;

          const oldPre = codeEl.parentElement;
          if (!oldPre) return;

          const wrapper = document.createElement('div');
          wrapper.className = 'code-block';

          const langName = displayLang(lang);
          if (langName) {
            const langLabel = document.createElement('div');
            langLabel.className = 'code-block-lang';
            langLabel.textContent = langName;
            wrapper.appendChild(langLabel);
          }

          const tmp = document.createElement('div');
          tmp.innerHTML = highlighted;
          const newPre = tmp.firstElementChild;
          if (!newPre) return;
          wrapper.appendChild(newPre);

          oldPre.replaceWith(wrapper);
        } catch (err) {
          console.warn('Highlight failed:', err);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [html, effectiveDark]);

    const fontFamilyClass = FONT_FAMILY_CLASS[readerFontFamily];
    const fontSizeClass = FONT_SIZE_CLASS[readerFontSize];
    const lineHeightValue = LINE_HEIGHT_VALUE[readerLineHeight];
    const widthClass = WIDTH_CLASS[readerWidth];

    /*
     * Merged ref: invoke both the forwarded ref (used by SplitView for sync
     * scrolling) AND the onScrollerReady callback (used by App.tsx to feed
     * the reading progress bar). Single DOM element, two consumers.
     *
     * The callback fires with the element on mount and with null on unmount,
     * giving App.tsx a reliable signal across mode switches — unlike a bare
     * `ref.current` read in a useEffect, which can miss the moment the new
     * element becomes available.
     */
    const setScrollerRef = (el: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
      onScrollerReady?.(el);
    };

    return (
      <div ref={setScrollerRef} onScroll={onScroll} className="h-full overflow-y-auto">
        <article
          key={theme}
          ref={articleRef}
          className={`prose-reader mx-auto px-8 py-12 ${fontFamilyClass} ${fontSizeClass} ${widthClass}`}
          style={{ '--reader-line-height': lineHeightValue } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  },
);
