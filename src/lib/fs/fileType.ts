/**
 * Detect the *category* of a file from its path. This is the single source
 * of truth used by:
 *   - Mode logic (markdown gets split mode; others get viewer/editor only)
 *   - Language extension loading (which CodeMirror lang-* to lazy-load)
 *   - Display layer routing (markdown→Renderer, json→JsonTreeViewer, ...)
 *   - File picker filters
 *
 * Design: any file can be opened — extensions we don't recognise fall back
 * to plain text. This matches the behaviour users expect from Notepad++ /
 * VSCode: drop anything, see content. Binary files still get a warning
 * upstream (see file size / binary detection), but the *category* logic
 * itself never refuses a file.
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

/**
 * Extensions we have *native* support for — meaning we offer them in the
 * file picker's "All supported" filter and register file-association
 * handlers for them in tauri.conf.json. Files outside this list still
 * open fine, they just fall through to the plain-text path.
 */
export const NATIVE_EXTENSIONS = [
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

/** Back-compat re-export — older code imports this name. */
export const SUPPORTED_EXTENSIONS = NATIVE_EXTENSIONS;

export type NativeExtension = typeof NATIVE_EXTENSIONS[number];

export function detectFileType(path: string | null): FileCategory {
  if (!path) return 'markdown'; // null path → welcome doc / new buffer

  // Extract just the filename so paths like "/home/user.name/hosts"
  // don't confuse the ext-split logic.
  const filename = path.split(/[/\\]/).pop() ?? '';

  // Files with no extension (hosts, Makefile, LICENSE, .bashrc, .gitignore)
  // are treated as plain text. We detect "no extension" by the absence
  // of a dot in the filename, OR the dot being at position 0 (dotfiles
  // like .gitignore — these are conventionally plain text on Linux).
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx <= 0) return 'text';

  const ext = filename.slice(dotIdx + 1).toLowerCase();
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
      // Default: anything else → plain text. We choose to render rather
      // than refuse; this matches Notepad++ / VSCode UX. If the content
      // turns out to be binary, the binary-detection check upstream
      // (in files.ts) will have already prompted the user.
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
 * Check whether a file has a *native* extension. Used to decide where in
 * the file picker the file falls (native filter vs "All files"), and
 * whether file-association badges apply. Does NOT gate open-ability —
 * any file can be opened as plain text via detectFileType's fallback.
 */
export function hasNativeExtension(path: string): boolean {
  const filename = path.split(/[/\\]/).pop() ?? '';
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx <= 0) return false;
  const ext = filename.slice(dotIdx + 1).toLowerCase();
  return (NATIVE_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Back-compat alias. Older call sites used isSupported as a gate; we no
 * longer gate, so this returns true unconditionally — every file is
 * openable. Kept as an alias so we don't have to touch every call site
 * in one go; new code should use `hasNativeExtension` if it actually
 * wants the previous semantics.
 */
export function isSupported(_path: string): boolean {
  return true;
}
