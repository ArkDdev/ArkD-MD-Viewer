/**
 * UI translations for ArkD. MD Viewer.
 *
 * Convention: keys are dot-separated namespaces — `<area>.<element>.<state?>`.
 * When adding new strings, add the key to BOTH language dictionaries; if a
 * translation is missing, t() falls back to the key itself which makes
 * missing translations very visible during testing.
 */

export const SUPPORTED_LANGUAGES = ['ru', 'en'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

type Dict = Record<string, string>;

const ru: Dict = {
  // ── Burger menu ────────────────────────────────────────────
  'menu.new': 'Новый файл',
  'menu.open': 'Открыть…',
  'menu.save': 'Сохранить',
  'menu.saveAs': 'Сохранить как…',
  'menu.settings': 'Настройки',

  // ── Topbar buttons ──────────────────────────────────────────
  'topbar.theme.light': 'Светлая тема',
  'topbar.theme.dark': 'Тёмная тема',
  'topbar.display': 'Отображение',
  'topbar.editToggle.toEdit': 'Редактирование',
  'topbar.editToggle.toView': 'Просмотр',
  'topbar.menu': 'Меню',

  // ── Editor toolbar ──────────────────────────────────────────
  'editor.tool.bold': 'Жирный',
  'editor.tool.italic': 'Курсив',
  'editor.tool.strike': 'Зачёркнутый',
  'editor.tool.code': 'Inline code',
  'editor.tool.h1': 'Заголовок 1',
  'editor.tool.h2': 'Заголовок 2',
  'editor.tool.h3': 'Заголовок 3',
  'editor.tool.link': 'Ссылка',
  'editor.tool.list': 'Список',
  'editor.tool.quote': 'Цитата',
  'editor.tool.codeBlock': 'Блок кода',
  'editor.linkPlaceholder': 'текст',
  'editor.showPreview': 'Показать превью',
  'editor.hidePreview': 'Скрыть превью',

  // ── Display modal ───────────────────────────────────────────
  'display.title': 'Отображение',
  'display.section.document': 'Документ',
  'display.section.editor': 'Редактор',
  'display.font': 'Шрифт',
  'display.size': 'Размер',
  'display.lineHeight': 'Высота строки',
  'display.lineHeight.compact': 'Плотно',
  'display.lineHeight.normal': 'Обычно',
  'display.lineHeight.relaxed': 'Просторно',
  'display.width': 'Ширина области просмотра',
  'display.width.narrow': 'Узкая',
  'display.width.medium': 'Средняя',
  'display.width.wide': 'Широкая',
  'display.width.full': 'По окну',
  'display.editorFontSize': 'Размер шрифта в редакторе',
  'display.editorWrap': 'Перенос строк',
  'display.reset': 'Сбросить к настройкам по умолчанию',
  'display.done': 'Готово',

  // ── Settings modal ──────────────────────────────────────────
  'settings.title': 'Настройки приложения',
  'settings.section.language': 'Язык интерфейса',
  'settings.section.updates': 'Обновления',
  'settings.section.about': 'О приложении',
  'settings.language.ru': 'Русский',
  'settings.language.en': 'English',
  'settings.updates.currentVersion': 'Текущая версия',
  'settings.updates.checkButton': 'Проверить обновления',
  'settings.updates.hint': 'Откроется страница релизов на GitHub',
  'settings.about.tagline': 'Быстрый, легковесный markdown viewer',
  'settings.about.openOnGitHub': 'Открыть на GitHub',
  'settings.close': 'Закрыть',

  // ── Conflict modal ──────────────────────────────────────────
  'conflict.title': 'Обновление файла',
  'conflict.description.prefix': 'Файл',
  'conflict.description.suffix':
    'был изменён другой программой. Если загрузить обновлённую версию, ваши текущие изменения в редакторе будут потеряны.',
  'conflict.question': 'Что сделать?',
  'conflict.reload': 'Загрузить обновлённый файл',
  'conflict.keep': 'Оставить мои изменения',

  // ── Unsaved changes guard ───────────────────────────────────
  'unsaved.title': 'Несохранённые изменения',
  'unsaved.description.named':
    'Файл «{name}» содержит несохранённые изменения. Что сделать?',
  'unsaved.description.unnamed':
    'Документ содержит несохранённые изменения. Что сделать?',
  'unsaved.save': 'Сохранить',
  'unsaved.discard': 'Не сохранять',
  'unsaved.cancel': 'Отмена',

  // ── Drag & drop overlay ─────────────────────────────────────
  'dragdrop.openOne': 'Открыть файл',
  'dragdrop.openFirstOf': 'Открыть первый из {count} файлов',
  'dragdrop.unsupported': 'Поддерживаются только .md, .markdown, .mdx, .mkd',
  'dragdrop.unsupportedHint': 'Перетащите файл с расширением .md или .markdown',

  // ── File / window ───────────────────────────────────────────
  'file.untitled': 'Без названия',

  // ── Welcome doc ─────────────────────────────────────────────
  'welcome.doc': `# Добро пожаловать в ArkD. MD Viewer

Быстрый и лёгкий просмотрщик markdown с возможностью редактирования.

## С чего начать

- Нажмите **⌘O / Ctrl+O**, чтобы открыть markdown-файл
- Нажмите **⌘E / Ctrl+E**, чтобы переключить режим редактирования
- Нажмите **⌘S / Ctrl+S**, чтобы сохранить

## Возможности

- GitHub-flavoured markdown
- Подсветка синтаксиса через Shiki
- Списки задач, сноски, таблицы

> Откройте \`.md\` файл или начните печатать.
`,
};

const en: Dict = {
  // ── Burger menu ────────────────────────────────────────────
  'menu.new': 'New file',
  'menu.open': 'Open…',
  'menu.save': 'Save',
  'menu.saveAs': 'Save as…',
  'menu.settings': 'Settings',

  // ── Topbar buttons ──────────────────────────────────────────
  'topbar.theme.light': 'Light theme',
  'topbar.theme.dark': 'Dark theme',
  'topbar.display': 'Display',
  'topbar.editToggle.toEdit': 'Edit',
  'topbar.editToggle.toView': 'Preview',
  'topbar.menu': 'Menu',

  // ── Editor toolbar ──────────────────────────────────────────
  'editor.tool.bold': 'Bold',
  'editor.tool.italic': 'Italic',
  'editor.tool.strike': 'Strikethrough',
  'editor.tool.code': 'Inline code',
  'editor.tool.h1': 'Heading 1',
  'editor.tool.h2': 'Heading 2',
  'editor.tool.h3': 'Heading 3',
  'editor.tool.link': 'Link',
  'editor.tool.list': 'List',
  'editor.tool.quote': 'Quote',
  'editor.tool.codeBlock': 'Code block',
  'editor.linkPlaceholder': 'text',
  'editor.showPreview': 'Show preview',
  'editor.hidePreview': 'Hide preview',

  // ── Display modal ───────────────────────────────────────────
  'display.title': 'Display',
  'display.section.document': 'Document',
  'display.section.editor': 'Editor',
  'display.font': 'Font',
  'display.size': 'Size',
  'display.lineHeight': 'Line height',
  'display.lineHeight.compact': 'Compact',
  'display.lineHeight.normal': 'Normal',
  'display.lineHeight.relaxed': 'Relaxed',
  'display.width': 'Reading area width',
  'display.width.narrow': 'Narrow',
  'display.width.medium': 'Medium',
  'display.width.wide': 'Wide',
  'display.width.full': 'Full',
  'display.editorFontSize': 'Editor font size',
  'display.editorWrap': 'Line wrap',
  'display.reset': 'Reset to defaults',
  'display.done': 'Done',

  // ── Settings modal ──────────────────────────────────────────
  'settings.title': 'Application settings',
  'settings.section.language': 'Interface language',
  'settings.section.updates': 'Updates',
  'settings.section.about': 'About',
  'settings.language.ru': 'Русский',
  'settings.language.en': 'English',
  'settings.updates.currentVersion': 'Current version',
  'settings.updates.checkButton': 'Check for updates',
  'settings.updates.hint': 'Opens the releases page on GitHub',
  'settings.about.tagline': 'Fast, lightweight markdown viewer',
  'settings.about.openOnGitHub': 'Open on GitHub',
  'settings.close': 'Close',

  // ── Conflict modal ──────────────────────────────────────────
  'conflict.title': 'File updated',
  'conflict.description.prefix': 'File',
  'conflict.description.suffix':
    'was modified by another program. Loading the updated version will discard your current edits.',
  'conflict.question': 'What would you like to do?',
  'conflict.reload': 'Load updated file',
  'conflict.keep': 'Keep my edits',

  // ── Unsaved changes guard ───────────────────────────────────
  'unsaved.title': 'Unsaved changes',
  'unsaved.description.named':
    'The file "{name}" has unsaved changes. What would you like to do?',
  'unsaved.description.unnamed':
    'This document has unsaved changes. What would you like to do?',
  'unsaved.save': 'Save',
  'unsaved.discard': 'Don\'t save',
  'unsaved.cancel': 'Cancel',

  // ── Drag & drop overlay ─────────────────────────────────────
  'dragdrop.openOne': 'Open file',
  'dragdrop.openFirstOf': 'Open first of {count} files',
  'dragdrop.unsupported': 'Only .md, .markdown, .mdx, .mkd are supported',
  'dragdrop.unsupportedHint': 'Drop a file with .md or .markdown extension',

  // ── File / window ───────────────────────────────────────────
  'file.untitled': 'Untitled',

  // ── Welcome doc ─────────────────────────────────────────────
  'welcome.doc': `# Welcome to ArkD. MD Viewer

A fast, lightweight markdown viewer with editing on demand.

## Getting started

- Press **⌘O / Ctrl+O** to open a markdown file
- Press **⌘E / Ctrl+E** to toggle edit mode
- Press **⌘S / Ctrl+S** to save

## Features

- GitHub-flavoured markdown
- Syntax highlighting via Shiki
- Task lists, footnotes, tables

> Open a \`.md\` file or start typing to begin.
`,
};

export const translations: Record<Language, Dict> = { ru, en };

/**
 * Detect the user's preferred language from the browser/OS.
 * Returns 'ru' if any Russian-related locale is present, otherwise 'en'.
 */
export function detectSystemLanguage(): Language {
  const langs = navigator.languages ?? [navigator.language];
  for (const l of langs) {
    if (typeof l === 'string' && l.toLowerCase().startsWith('ru')) return 'ru';
  }
  return 'en';
}
