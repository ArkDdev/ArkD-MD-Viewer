import { create } from 'zustand';

const WELCOME_DOC = `# Welcome to ArkD. MD Viewer

A fast, lightweight markdown viewer with editing on demand.

## Getting started

- Press **⌘O / Ctrl+O** to open a markdown file
- Press **⌘E / Ctrl+E** to toggle edit mode
- Press **⌘S / Ctrl+S** to save

## Features

- GitHub-flavoured markdown
- Syntax highlighting via Shiki
- Math via KaTeX
- Task lists, footnotes, tables

> Open a \`.md\` file or start typing to begin.
`;

interface FileState {
  filePath: string | null;
  content: string;
  originalContent: string;
  isDirty: boolean;

  setContent: (content: string) => void;
  loadFile: (path: string, content: string) => void;
  markSaved: () => void;
  reset: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  filePath: null,
  content: WELCOME_DOC,
  originalContent: WELCOME_DOC,
  isDirty: false,

  setContent: (content) =>
    set((state) => ({
      content,
      isDirty: content !== state.originalContent,
    })),

  loadFile: (path, content) =>
    set({
      filePath: path,
      content,
      originalContent: content,
      isDirty: false,
    }),

  markSaved: () =>
    set((state) => ({
      originalContent: state.content,
      isDirty: false,
    })),

  reset: () =>
    set({
      filePath: null,
      content: WELCOME_DOC,
      originalContent: WELCOME_DOC,
      isDirty: false,
    }),
}));
