import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import { highlightCode } from '@/lib/highlight/shiki';

/**
 * Configured markdown-it instance.
 *
 * Notes:
 * - `html: false` keeps raw HTML out of the parsed output, which is the
 *   safest default for a viewer that opens arbitrary files.
 * - Code highlighting uses Shiki and is applied asynchronously after the
 *   initial render — see `Renderer.tsx`.
 */
export const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
})
  .use(anchor, {
    permalink: anchor.permalink.linkInsideHeader({
      symbol: '#',
      placement: 'after',
      class: 'heading-anchor',
    }),
    slugify: (s) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
  })
  .use(footnote)
  .use(taskLists, { enabled: true });

export function renderMarkdown(source: string): string {
  return md.render(source);
}

/**
 * Re-export so callers can wire up async highlighting after the DOM exists.
 */
export { highlightCode };
