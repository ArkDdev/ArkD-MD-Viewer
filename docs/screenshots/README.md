# Screenshots for README

Put your screenshots in this folder with these exact filenames so the README links resolve:

| Filename | What to capture | Recommended size |
|---|---|---|
| `hero.png` | Split mode (edit + preview), light theme, opened on a real markdown document with headings, lists, and a code block | 1600×1000 (will scale to 900px wide) |
| `light.png` | Pure preview mode, light theme | 1200×800 |
| `dark.png` | Same content as `light.png`, but in dark theme | 1200×800 |
| `edit.png` | Split mode, dark theme, document being edited (cursor visible, ideally a header line) | 1200×800 |
| `display.png` | Light or dark theme with the Display modal open | 1200×800 |

## How to take a clean screenshot on Windows

1. Open ArkD. MD Viewer with a representative document. The text matters — avoid placeholder lorem ipsum. Use something readable, ideally about the project itself.

2. Resize the window to a clean ratio — 1280×800 or similar. Don't capture the whole 4K monitor; the screenshot will compress and details disappear.

3. Use **Win+Shift+S** for area selection (Snipping Tool) — capture the entire ArkD window including the title bar with the M icon.

4. Save as `.png`. JPEG compression makes text blurry; PNG is lossless.

5. Optional but recommended: open the screenshot in any editor and **trim to the exact window border** — no taskbar, no desktop background.

## Tips for the hero shot

The hero shot is the first thing people see. Make it good:

- **Real markdown content**, not "Hello World". Use something like the welcome doc or a piece of your own writing
- Make sure both **headings and code** are visible — readers should immediately understand what the app does
- Cursor should NOT be visible in the editor (Esc to defocus before screenshotting)
- No conflict banners, no modals open

## After dropping screenshots in

The screenshots will automatically appear in:

- `README.md` — main English version
- `README.ru.md` — Russian version

Both READMEs reference the same files (`docs/screenshots/*.png`). One set of screenshots, two languages.
