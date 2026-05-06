import { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown } from '@/lib/markdown/parser';
import { highlightCode } from '@/lib/highlight/shiki';
import { useUIStore } from '@/store/uiStore';

interface RendererProps {
  source: string;
}

export function Renderer({ source }: RendererProps) {
  const { fontSize, readerWidth } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => renderMarkdown(source), [source]);

  // Apply syntax highlighting after render. Shiki is async, so we patch
  // <pre><code class="language-…"> blocks in place once highlighted.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const isDark = document.documentElement.classList.contains('dark');
    const blocks = root.querySelectorAll<HTMLElement>('pre > code[class*="language-"]');
    let cancelled = false;

    blocks.forEach(async (codeEl) => {
      const langMatch = codeEl.className.match(/language-([\w-]+)/);
      const lang = langMatch?.[1];
      const code = codeEl.textContent ?? '';

      try {
        const highlighted = await highlightCode(code, lang, isDark);
        if (cancelled) return;
        const pre = codeEl.parentElement;
        if (pre) {
          // Replace the entire <pre> with Shiki's output
          const wrapper = document.createElement('div');
          wrapper.innerHTML = highlighted;
          const newPre = wrapper.firstElementChild;
          if (newPre) pre.replaceWith(newPre);
        }
      } catch (err) {
        console.warn('Highlight failed:', err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [html]);

  const fontClass = {
    sm: 'text-reader-sm',
    base: 'text-reader-base',
    lg: 'text-reader-lg',
    xl: 'text-reader-xl',
  }[fontSize];

  const widthClass = readerWidth === 'narrow' ? 'max-w-reader' : 'max-w-reader-wide';

  return (
    <div className="h-full overflow-y-auto">
      <article
        ref={containerRef}
        className={`prose-reader mx-auto ${fontClass} ${widthClass} px-8 py-12`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
