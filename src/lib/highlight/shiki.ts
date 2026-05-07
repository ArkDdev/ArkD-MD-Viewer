import { createHighlighter, type Highlighter } from 'shiki';

const PRELOADED_LANGS = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'json',
  'bash',
  'shell',
  'python',
  'rust',
  'markdown',
  'html',
  'css',
] as const;

const THEMES = ['github-light', 'github-dark'] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [...THEMES],
      langs: [...PRELOADED_LANGS],
    });
  }
  return highlighterPromise;
}

const loadedLangs = new Set<string>(PRELOADED_LANGS);

async function ensureLanguage(lang: string): Promise<string> {
  const normalized = lang.toLowerCase();
  if (loadedLangs.has(normalized)) return normalized;
  try {
    const hl = await getHighlighter();
    await hl.loadLanguage(normalized as never);
    loadedLangs.add(normalized);
    return normalized;
  } catch {
    return 'text';
  }
}

/**
 * Highlights a code block. Returns HTML <pre>...</pre>.
 *
 * We strip Shiki's `background-color` from <pre> and <code> so our CSS
 * tokens (--code-bg) take over. Token colors stay as inline styles.
 */
export async function highlightCode(
  code: string,
  lang: string | undefined,
  isDark: boolean,
): Promise<string> {
  const hl = await getHighlighter();
  const resolvedLang = lang ? await ensureLanguage(lang) : 'text';
  const html = hl.codeToHtml(code, {
    lang: resolvedLang,
    theme: isDark ? 'github-dark' : 'github-light',
  });

  // Remove Shiki's background-color from the outer <pre> and any inner <code>
  // so our CSS theme governs the block's surface. Token spans keep their colors.
  return html
    .replace(/(<pre[^>]*?style="[^"]*?)background-color:[^;"]+;?/g, '$1')
    .replace(/(<code[^>]*?style="[^"]*?)background-color:[^;"]+;?/g, '$1');
}
