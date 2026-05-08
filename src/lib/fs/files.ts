import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { useFileStore } from '@/store/fileStore';
import { detectFileType } from '@/lib/fs/fileType';

export interface OpenedFile {
  path: string;
  content: string;
}

/**
 * Show a native file picker and read the chosen file. The filter offers a
 * grouped "All supported" entry plus per-format entries so users can narrow
 * down to e.g. only JSON if they want.
 *
 * Returns null if the user cancels.
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
    ],
  });

  if (!selected || typeof selected !== 'string') return null;

  const content = await invoke<string>('read_text_file', { path: selected });
  return { path: selected, content };
}

/**
 * Read a file by absolute path (used by drag&drop, file associations,
 * and the initial launch handler).
 */
export async function readFileByPath(path: string): Promise<OpenedFile> {
  const content = await invoke<string>('read_text_file', { path });
  return { path, content };
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
