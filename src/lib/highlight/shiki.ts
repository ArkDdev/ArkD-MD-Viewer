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
 * Highlights a code block. Returns HTML <pre>…</pre>.
 * If the language isn't recognised, falls back to plain text.
 */
export async function highlightCode(
  code: string,
  lang: string | undefined,
  isDark: boolean,
): Promise<string> {
  const hl = await getHighlighter();
  const resolvedLang = lang ? await ensureLanguage(lang) : 'text';
  return hl.codeToHtml(code, {
    lang: resolvedLang,
    theme: isDark ? 'github-dark' : 'github-light',
  });
}
