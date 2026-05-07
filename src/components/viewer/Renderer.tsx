import { forwardRef, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { renderMarkdown } from '@/lib/markdown/parser';
import { highlightCode } from '@/lib/highlight/shiki';
import { useUIStore, resolveTheme } from '@/store/uiStore';

interface RendererProps {
  source: string;
  onScroll?: (e: UIEvent<HTMLDivElement>) => void;
}

/** Friendly display name for a language id used in the corner label. */
function displayLang(lang: string | undefined): string | null {
  if (!lang || lang === 'text' || lang === 'plain') return null;
  // Keep simple: lowercase as-is, but rename a few common ones for prettiness
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

export const Renderer = forwardRef<HTMLDivElement, RendererProps>(
  function Renderer({ source, onScroll }, ref) {
    const { fontSize, readerWidth, themeOverride } = useUIStore();
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

          // Build the wrapper: <div class="code-block">[<div class="code-block-lang">lang</div>]<pre>...</pre></div>
          const wrapper = document.createElement('div');
          wrapper.className = 'code-block';

          const langName = displayLang(lang);
          if (langName) {
            const langLabel = document.createElement('div');
            langLabel.className = 'code-block-lang';
            langLabel.textContent = langName;
            wrapper.appendChild(langLabel);
          }

          // Parse Shiki's highlighted HTML into the new <pre>
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

    const fontClass = {
      sm: 'text-reader-sm',
      base: 'text-reader-base',
      lg: 'text-reader-lg',
      xl: 'text-reader-xl',
    }[fontSize];

    const widthClass = readerWidth === 'narrow' ? 'max-w-reader' : 'max-w-reader-wide';

    return (
      <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto">
        <article
          key={theme}
          ref={articleRef}
          className={`prose-reader mx-auto ${fontClass} ${widthClass} px-8 py-12`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  },
);
