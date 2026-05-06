import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';

export interface OpenedFile {
  path: string;
  content: string;
}

/**
 * Show a native file picker and read the chosen markdown file.
 * Returns null if the user cancels.
 */
export async function pickAndOpenFile(): Promise<OpenedFile | null> {
  const selected = await openDialog({
    multiple: false,
    filters: [
      {
        name: 'Markdown',
        extensions: ['md', 'markdown', 'mdx', 'mkd', 'txt'],
      },
    ],
  });

  if (!selected || typeof selected !== 'string') return null;

  const content = await invoke<string>('read_text_file', { path: selected });
  return { path: selected, content };
}

/**
 * Read a file by absolute path (used when the app is launched with a
 * file argument, e.g. from "Open with…" in the file manager).
 */
export async function readFileByPath(path: string): Promise<OpenedFile> {
  const content = await invoke<string>('read_text_file', { path });
  return { path, content };
}

/**
 * Save content to the given path.
 */
export async function saveFile(path: string, content: string): Promise<void> {
  await invoke('write_text_file', { path, content });
}

/**
 * Show a native save-as dialog and write the file there.
 * Returns the chosen path, or null if cancelled.
 */
export async function saveFileAs(
  content: string,
  defaultName = 'untitled.md',
): Promise<string | null> {
  const path = await saveDialog({
    defaultPath: defaultName,
    filters: [
      {
        name: 'Markdown',
        extensions: ['md', 'markdown'],
      },
    ],
  });

  if (!path) return null;
  await saveFile(path, content);
  return path;
}
