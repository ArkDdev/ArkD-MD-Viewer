# ArkD. MD Viewer

A fast, lightweight Markdown viewer with on-demand editing.
Built on Tauri 2 + React + TypeScript + Tailwind. Bundle size target: < 10 MB.

## Philosophy

ArkD opens `.md` files for **reading first**. The editor is one keystroke
away (⌘E / Ctrl+E), but it isn't the default — the goal is the calm,
typography-led reading experience of Claude Desktop, not yet another IDE for
Markdown.

## Stack

- **Tauri 2** — Rust backend, system WebView frontend
- **Vite + React 18 + TypeScript** — UI
- **Tailwind CSS v3** — styling, with custom design tokens
- **markdown-it** + plugins — parsing (anchor, footnote, task-lists)
- **Shiki** — syntax highlighting (lazy language loading)
- **CodeMirror 6** — editor
- **Zustand** — state management

## Prerequisites

- **Node.js** ≥ 20
- **Rust** ≥ 1.77 (install via [rustup](https://rustup.rs))
- **Platform-specific**:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: Microsoft C++ Build Tools + WebView2 (preinstalled on Win11)
  - **Linux**: `webkit2gtk-4.1`, `libssl-dev`, `librsvg2-dev`, `patchelf`,
    `build-essential`. See the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

## Getting started

```bash
# Install JS dependencies
npm install

# Run in dev mode (Vite + Tauri dev window)
npm run tauri:dev

# Build a production bundle for the current platform
npm run tauri:build
```

The first `tauri:dev` will compile the Rust toolchain and may take a few
minutes. Subsequent runs are fast.

## Project layout

```
src/                    Frontend (React)
├── app/                Entry point, root component
├── components/
│   ├── viewer/         Markdown renderer
│   ├── editor/         CodeMirror wrapper
│   ├── chrome/         TitleBar, Toolbar
│   └── ui/             Reusable primitives
├── lib/
│   ├── markdown/       markdown-it parser config
│   ├── highlight/      Shiki singleton
│   └── fs/             Tauri FS wrappers, file-open handler
├── store/              Zustand stores
└── styles/             Tailwind globals + design tokens

src-tauri/              Rust backend
├── src/
│   ├── main.rs         Binary entry
│   ├── lib.rs          App setup, file-association handling
│   └── commands.rs     read_text_file, write_text_file, get_initial_file
├── capabilities/       Tauri v2 permissions
└── tauri.conf.json     Window, bundle, file associations
```

## Keyboard shortcuts

| Action          | Windows / Linux  | macOS         |
| --------------- | ---------------- | ------------- |
| Open file       | `Ctrl+O`         | `⌘O`          |
| Toggle edit     | `Ctrl+E`         | `⌘E`          |
| Save            | `Ctrl+S`         | `⌘S`          |
| Save as         | `Ctrl+Shift+S`   | `⌘⇧S`         |

## Icons

Before the first `tauri:build` you need to generate icons. The simplest path:

```bash
# Place a 1024×1024 PNG at ./app-icon.png, then:
npx @tauri-apps/cli icon ./app-icon.png
```

This populates `src-tauri/icons/` with all required formats.

## Roadmap

- [x] Reader-first viewer with Claude-style typography
- [x] Edit mode (CodeMirror 6)
- [x] Split view
- [x] OS file association for `.md`
- [ ] Live file-watcher (auto-reload on external changes)
- [ ] Sidebar with recent files
- [ ] Export to HTML / PDF
- [ ] Mermaid + KaTeX rendering
- [ ] Custom themes / user CSS

## License

TBD.
