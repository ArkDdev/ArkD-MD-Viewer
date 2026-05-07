<div align="center">
  <img src="branding/arkd-icon.png" alt="ArkD. MD Viewer" width="120" height="120">

  <h1>ArkD. MD Viewer</h1>

  <p>
    <strong>Быстрый, легковесный просмотрщик Markdown с возможностью редактирования.</strong><br>
    Сделан на Tauri 2 — установщик меньше 4 МБ, запуск меньше секунды.
  </p>

  <p>
    <a href="https://github.com/ArkDdev/ArkD-MD-Viewer/releases/latest"><img src="https://img.shields.io/github/v/release/ArkDdev/ArkD-MD-Viewer?label=релиз&color=C76D46" alt="Последний релиз"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/лицензия-MIT-blue.svg" alt="Лицензия: MIT"></a>
    <img src="https://img.shields.io/badge/платформа-Windows-lightgrey" alt="Платформа: Windows">
  </p>

  <p>
    <a href="https://github.com/ArkDdev/ArkD-MD-Viewer/releases/latest">⬇ Скачать для Windows</a>
    ·
    <a href="#возможности">Возможности</a>
    ·
    <a href="#скриншоты">Скриншоты</a>
    ·
    <a href="README.md">🇬🇧 English</a>
  </p>
</div>

<br>

<p align="center">
  <img src="docs/screenshots/hero.png" alt="ArkD. MD Viewer в режиме split" width="900">
</p>

---

## Зачем нужен ArkD?

Большинство Markdown-редакторов огромные — Obsidian около 150 МБ, Typora ~70 МБ, MarkText ~120 МБ. Все они тащат с собой Chromium, хотя в системе уже есть свой браузерный движок.

ArkD. MD Viewer весит **3.3 МБ**, потому что использует Tauri 2 и системный WebView. Делает несколько вещей, которые нужны для работы с markdown — но делает их хорошо.

## Возможности

- 📄 **Просмотр и редактирование** — переключайся между preview, split-режимом и полноэкранным редактором
- 🎨 **Светлая, тёмная и системная темы** — переключение по `☀ ☾`
- 🔄 **Отслеживание внешних изменений файла** — когда файл меняется в другом редакторе, ArkD обновит его (или спросит, если у тебя есть несохранённые правки)
- 🪂 **Drag & drop** — перетащи `.md` на окно, чтобы открыть
- ⌨️ **Хоткеи работают на любой раскладке** — `Ctrl+S` срабатывает и на русской `Ctrl+Ы` (используются физические клавиши, а не символы)
- 🔤 **Встроенные шрифты** — Inter, Source Serif 4, JetBrains Mono идут вместе с приложением
- 🎛 **Гибкая настройка отображения** — шрифт, размер, межстрочный интервал, ширина области чтения
- 🌍 **Русский и английский UI** — определяется автоматически по системе
- 🎨 **Подсветка синтаксиса в коде** через Shiki (с указанием языка)
- 📎 **Ассоциации файлов** — `.md` файлы открываются в ArkD прямо из проводника
- 🚀 **Маленький и быстрый** — установщик 3-4 МБ, холодный старт меньше секунды

## Скриншоты

<table>
<tr>
<td align="center"><b>Светлая тема</b></td>
<td align="center"><b>Тёмная тема</b></td>
</tr>
<tr>
<td><img src="docs/screenshots/light.png" alt="Светлая тема"></td>
<td><img src="docs/screenshots/dark.png" alt="Тёмная тема"></td>
</tr>
<tr>
<td align="center"><b>Режим редактирования</b></td>
<td align="center"><b>Настройки отображения</b></td>
</tr>
<tr>
<td><img src="docs/screenshots/edit.png" alt="Режим редактирования"></td>
<td><img src="docs/screenshots/display.png" alt="Настройки отображения"></td>
</tr>
</table>

## Установка

### Windows

Скачай последний установщик со [страницы Releases](https://github.com/ArkDdev/ArkD-MD-Viewer/releases/latest):

- **NSIS installer** (`.exe`) — рекомендуется для личного использования, при установке предлагает выбор языка
- **MSI installer** (`.msi`) — для корпоративной среды с групповыми политиками

Оба установщика регистрируют ассоциации для `.md`, `.markdown`, `.mdx` и `.mkd` системно.

### macOS / Linux

Скоро — планируется через GitHub Actions.

## Горячие клавиши

| Действие | Сочетание |
|---|---|
| Новый файл | `Ctrl+N` |
| Открыть файл | `Ctrl+O` |
| Сохранить | `Ctrl+S` |
| Сохранить как | `Ctrl+Shift+S` |
| Переключение edit / preview | `Ctrl+E` |
| Настройки | `Ctrl+,` |

Все хоткеи используют **физические коды клавиш**, поэтому они работают одинаково на любой раскладке — включая русскую.

## Технологии

- **[Tauri 2](https://tauri.app/)** — Rust-бэкенд с системным WebView2 (без Electron)
- **[React 18](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)** — UI-слой
- **[Vite 5](https://vitejs.dev/)** — сборка фронтенда
- **[CodeMirror 6](https://codemirror.net/)** — редактор
- **[markdown-it](https://github.com/markdown-it/markdown-it)** — парсер markdown
- **[Shiki](https://shiki.style/)** — подсветка синтаксиса (TextMate-грамматики, lazy-load)
- **[Tailwind CSS 3](https://tailwindcss.com/)** — стилизация
- **[Zustand](https://zustand-demo.pmnd.rs/)** — управление состоянием
- **[notify](https://github.com/notify-rs/notify)** + **[notify-debouncer-mini](https://crates.io/crates/notify-debouncer-mini)** — отслеживание файлов (Rust)

## Сборка из исходников

Требуется:

- **Node.js** 18+ и **npm**
- **Rust** (последняя стабильная версия) через [rustup](https://rustup.rs/)
- **Microsoft C++ Build Tools** на Windows
- **WebView2 Runtime** (предустановлен на Windows 11; авто-установка через NSIS)

```sh
git clone https://github.com/ArkDdev/ArkD-MD-Viewer.git
cd ArkD-MD-Viewer
npm install
npm run tauri:dev      # разработка с hot reload
npm run tauri:build    # production-сборка установщиков
```

Результат — в `src-tauri/target/release/bundle/`: NSIS-установщики в `nsis/`, MSI — в `msi/`.

## Дорожная карта

- [ ] Сборки для macOS и Linux через GitHub Actions
- [ ] Меню недавних файлов
- [ ] Сайдбар с оглавлением документа
- [ ] Поиск и замена внутри документа
- [ ] Поддержка `.txt`, `.json`, `.ini` (только редактор)
- [ ] Авто-обновления через GitHub Releases

Есть идея или запрос? Открой [issue](https://github.com/ArkDdev/ArkD-MD-Viewer/issues) или начни [discussion](https://github.com/ArkDdev/ArkD-MD-Viewer/discussions).

## Лицензия

[MIT](LICENSE) — Copyright © 2026 Arkadiy Karanskiy (ArkD.DEV)

Можно свободно использовать, модифицировать и распространять, в том числе в коммерческих целях. Единственное условие — сохранять упоминание автора в производных работах.

---

<div align="center">
  Сделано <a href="https://github.com/ArkDdev"><b>ArkDdev</b></a>
</div>
