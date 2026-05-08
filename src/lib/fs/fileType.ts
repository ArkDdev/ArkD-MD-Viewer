/**
 * Detect the *category* of a file from its path. This is the single source
 * of truth used by:
 *   - Mode logic (markdown gets split mode; others get viewer/editor only)
 *   - Language extension loading (which CodeMirror lang-* to lazy-load)
 *   - Display layer routing (markdown→Renderer, json→JsonTreeViewer, ...)
 *   - File picker filters
 *
 * We deliberately keep this list small and explicit. Adding a new extension
 * means: (1) add to SUPPORTED_EXTENSIONS, (2) add a case here, (3) maybe add
 * a lang-* import in Editor.tsx's loader.
 */

export type FileCategory =
  | 'markdown'
  | 'text'
  | 'json'
  | 'json5'
  | 'yaml'
  | 'toml'
  | 'ini'
  | 'xml'
  | 'log'
  | 'csv'
  | 'tsv';

/** Every extension we accept anywhere (open dialog, drag&drop, file-assoc). */
export const SUPPORTED_EXTENSIONS = [
  'md', 'markdown', 'mdx', 'mkd',
  'txt',
  'json', 'json5',
  'yaml', 'yml',
  'toml',
  'ini', 'conf',
  'xml',
  'log',
  'csv', 'tsv',
] as const;

export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number];

export function detectFileType(path: string | null): FileCategory {
  if (!path) return 'markdown'; // null path → welcome doc / new buffer
  const ext = path.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'md':
    case 'markdown':
    case 'mdx':
    case 'mkd':
      return 'markdown';
    case 'json':
      return 'json';
    case 'json5':
      return 'json5';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'toml':
      return 'toml';
    case 'ini':
    case 'conf':
      return 'ini';
    case 'xml':
      return 'xml';
    case 'log':
      return 'log';
    case 'csv':
      return 'csv';
    case 'tsv':
      return 'tsv';
    case 'txt':
    default:
      return 'text';
  }
}

/** True if the file should show markdown preview / split mode. */
export function isMarkdown(category: FileCategory): boolean {
  return category === 'markdown';
}

/** True if the file is structured data that can be displayed as a tree. */
export function isStructured(category: FileCategory): boolean {
  return category === 'json' || category === 'json5';
}

/**
 * Check whether a file path is supported. Used by drag&drop to filter out
 * irrelevant drops (folders, .exe, etc.).
 */
export function isSupported(path: string): boolean {
  const ext = path.toLowerCase().split('.').pop() ?? '';
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}
