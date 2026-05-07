# Release notes for v1.0.1

This is the first public release of **ArkD. MD Viewer** — feature-complete MVP.

Copy the text below into the GitHub Release description (Releases → Draft a new release → choose tag `v1.0.1`).

---

## 🎉 First release

ArkD. MD Viewer is a fast, lightweight Markdown viewer for Windows. It uses Tauri 2 and the system WebView, so the installer is **under 4 MB** and cold start is under a second.

### Features

- 📄 Three viewing modes: rendered preview, side-by-side split, and full-screen editor
- 🎨 Light, dark, and system-following themes
- 🔄 External file watcher with smart conflict resolution — reloads automatically when the buffer is clean, asks first when you have unsaved edits
- 🪂 Drag & drop support for `.md`, `.markdown`, `.mdx`, `.mkd`
- 📎 File associations (right-click → "Open with ArkD" works after installation)
- ⌨️ Keyboard shortcuts that work on any keyboard layout — `Ctrl+S` works on Russian `Ctrl+Ы` too
- 🔤 Bundled fonts: Inter, Source Serif 4, JetBrains Mono
- 🎛 Customisable display: font family, font size, line height, reading width
- 🌍 Russian and English UI, auto-detected from the system language
- 🎨 Code syntax highlighting via Shiki (with language label above each block)
- ✨ Smart bracket auto-closing in the editor
- 🪶 Frameless window with custom title bar (matches the app aesthetic)

### Performance

- **NSIS installer**: ~3.3 MB
- **MSI installer**: ~3.9 MB
- **Cold start**: under 1 second on a modern machine
- **No Electron** — uses your system's WebView2

### Install

Download the installer below and run it. Both installers register file associations for `.md` files system-wide and require admin rights once at install time.

- `ArkD. MD Viewer_1.0.1_x64-setup.exe` — recommended NSIS installer with language selector
- `ArkD. MD Viewer_1.0.1_x64_en-US.msi` — MSI for English systems
- `ArkD. MD Viewer_1.0.1_x64_ru-RU.msi` — MSI for Russian systems

### System requirements

- Windows 10 1809+ or Windows 11
- WebView2 Runtime (pre-installed on Windows 11; auto-installed by NSIS if missing)

### Known limitations

- Windows only — macOS and Linux builds are planned via GitHub Actions
- No auto-updater yet — check back here for new versions
- File watcher behaviour: the conflict modal shows in edit mode whenever the file changes externally, even if your buffer is clean. This is intentional — protects against accidental data loss when editing.

### Thanks

Built with [Tauri](https://tauri.app/), [React](https://react.dev/), [CodeMirror](https://codemirror.net/), [Shiki](https://shiki.style/), and many other open-source projects.

---

**License**: MIT
**Author**: Arkadiy Karanskiy (ArkD.DEV) — [@ArkDdev](https://github.com/ArkDdev)
