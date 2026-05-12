import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { detectFileType } from '@/lib/fs/fileType';

export interface OpenedFile {
  path: string;
  content: string;
}

/**
 * Soft threshold for "this file is large enough to warn about".
 * 10 MB. Picked because plain-text editors typically struggle at that
 * size — CodeMirror handles it but the user might be opening it by
 * accident (e.g. an .iso renamed to .log).
 */
const LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024;

/**
 * Show a native file picker and read the chosen file. The filter offers a
 * grouped "All supported" entry plus per-format entries plus a final
 * "All files (*.*)" entry — that last one lets users open files we don't
 * natively recognise (hosts, .bashrc, Makefile, ...) as plain text.
 *
 * Returns null if the user cancels OR if a size/binary check failed and
 * they chose not to proceed.
 */
export async function pickAndOpenFile(): Promise<OpenedFile | null> {
  const selected = await openDialog({
    multiple: false,
    filters: [
      {
        name: 'All supported',
        extensions: [
          'md', 'markdown', 'mdx', 'mkd',
          'txt',
          'json', 'json5',
          'yaml', 'yml',
          'toml',
          'ini', 'conf',
          'xml',
          'log',
          'csv', 'tsv',
        ],
      },
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdx', 'mkd'] },
      { name: 'JSON', extensions: ['json', 'json5'] },
      { name: 'YAML', extensions: ['yaml', 'yml'] },
      { name: 'TOML', extensions: ['toml'] },
      { name: 'INI / Config', extensions: ['ini', 'conf'] },
      { name: 'XML', extensions: ['xml'] },
      { name: 'CSV / TSV', extensions: ['csv', 'tsv'] },
      { name: 'Plain text', extensions: ['txt', 'log'] },
      // The catch-all. Users on Windows / macOS see this as "All files (*.*)";
      // on Linux it shows as "All files (*)" — the dialog driver renders it
      // appropriately for the platform. Lets users pick hosts, Makefile,
      // .gitignore, etc., which fall through to plain-text rendering.
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (!selected || typeof selected !== 'string') return null;

  return await readFileWithGuards(selected);
}

/**
 * Read a file by absolute path (used by drag&drop, file associations,
 * and the initial launch handler). Now goes through the same size /
 * binary guards as the picker so any entry point gets the same warnings.
 */
export async function readFileByPath(path: string): Promise<OpenedFile | null> {
  return await readFileWithGuards(path);
}

/**
 * Inspect a file before reading its content:
 *   - If it's larger than LARGE_FILE_THRESHOLD_BYTES → ask the user
 *   - If the first chunk looks binary (contains null bytes) → ask the user
 * Then either return the file contents or `null` if the user backed out.
 *
 * Both checks run in Rust to avoid a double-read; we ask for metadata +
 * a small head sample, decide in JS, then do the actual full read.
 */
async function readFileWithGuards(path: string): Promise<OpenedFile | null> {
  let probe: FileProbe;
  try {
    probe = await invoke<FileProbe>('probe_file', { path });
  } catch (err) {
    // If probing fails (permissions, race), fall back to direct read —
    // the read itself will surface a clearer error to the user.
    console.warn('probe_file failed, falling back to direct read:', err);
    const content = await invoke<string>('read_text_file', { path });
    return { path, content };
  }

  // Size warning
  if (probe.sizeBytes > LARGE_FILE_THRESHOLD_BYTES) {
    const mb = (probe.sizeBytes / 1024 / 1024).toFixed(1);
    const ok = await useUIStore
      .getState()
      .confirmLargeOrBinary({ kind: 'large', sizeMb: mb });
    if (!ok) return null;
  }

  // Binary warning — only if the size check didn't already abort us
  if (probe.looksBinary) {
    const ok = await useUIStore
      .getState()
      .confirmLargeOrBinary({ kind: 'binary' });
    if (!ok) return null;
  }

  const content = await invoke<string>('read_text_file', { path });
  return { path, content };
}

interface FileProbe {
  sizeBytes: number;
  looksBinary: boolean;
}

export async function saveFile(path: string, content: string): Promise<void> {
  await invoke('write_text_file', { path, content });
}

/**
 * Show a native save-as dialog and write the file there.
 *
 * The default name and the filter extensions adapt to the current file's
 * category — if you're working with a .json buffer, "Save as" will offer
 * .json by default and filter for JSON-related extensions. For unnamed
 * buffers (after "New file") we offer Markdown.
 */
export async function saveFileAs(
  content: string,
  defaultName?: string,
): Promise<string | null> {
  const state = useFileStore.getState();
  const category = state.category;
  const sourceName = state.filePath?.split(/[/\\]/).pop();

  const { filterName, extensions, fallbackName } = saveFilterFor(category);
  const initialName = defaultName ?? sourceName ?? fallbackName;

  const path = await saveDialog({
    defaultPath: initialName,
    filters: [
      { name: filterName, extensions },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (!path) return null;
  await saveFile(path, content);
  return path;
}

function saveFilterFor(category: ReturnType<typeof detectFileType>) {
  switch (category) {
    case 'markdown':
      return { filterName: 'Markdown', extensions: ['md', 'markdown'], fallbackName: 'untitled.md' };
    case 'json':
      return { filterName: 'JSON', extensions: ['json'], fallbackName: 'untitled.json' };
    case 'json5':
      return { filterName: 'JSON5', extensions: ['json5'], fallbackName: 'untitled.json5' };
    case 'yaml':
      return { filterName: 'YAML', extensions: ['yaml', 'yml'], fallbackName: 'untitled.yaml' };
    case 'toml':
      return { filterName: 'TOML', extensions: ['toml'], fallbackName: 'untitled.toml' };
    case 'ini':
      return { filterName: 'INI / Config', extensions: ['ini', 'conf'], fallbackName: 'untitled.ini' };
    case 'xml':
      return { filterName: 'XML', extensions: ['xml'], fallbackName: 'untitled.xml' };
    case 'log':
      return { filterName: 'Log', extensions: ['log'], fallbackName: 'untitled.log' };
    case 'csv':
      return { filterName: 'CSV', extensions: ['csv'], fallbackName: 'untitled.csv' };
    case 'tsv':
      return { filterName: 'TSV', extensions: ['tsv'], fallbackName: 'untitled.tsv' };
    case 'text':
    default:
      return { filterName: 'Plain text', extensions: ['txt'], fallbackName: 'untitled.txt' };
  }
}
