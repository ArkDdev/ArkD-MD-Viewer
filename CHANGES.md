# v1.2.3 — Hotfix: require() crash + dev mode CMD explanation

## Что нужно сделать

1. Распакуй архив **поверх v1.2.2** (6 файлов).
2. **`npm run tauri:dev`** — пересборка только TypeScript, Rust не трогали.

## Главное — пустое окно после elevation

### Корневая причина

В `elevation.ts` я написал такой код:

```typescript
function detectCategoryFromPath(path: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { detectFileType } = require('@/lib/fs/fileType') as typeof import('@/lib/fs/fileType');
  return detectFileType(path);
}
```

**`require()` не существует в ES modules**. Vite/Tauri используют ES modules в браузере, синхронный CommonJS `require()` там **не определён**. При вызове падает `ReferenceError: require is not defined`.

Когда elevated процесс стартует → useEffect в App.tsx вызывает `applyHydrationState()` → она вызывает `detectCategoryFromPath()` → **ReferenceError** → React fails to render → пустой `<div id="root"></div>`. Это ровно то что ты увидел в DevTools.

Почему я **вообще** использовал `require()`? Я **думал** что есть circular dependency между `elevation.ts` и `fileType.ts` (через i18n или fileStore). На самом деле — нет такой циркуляции. Зря написал хак.

### Фикс

Заменил на обычный `import`:

```typescript
import { detectFileType } from '@/lib/fs/fileType';
// ...
category: detectFileType(snapshot.filePath),
```

Прямой ES module import. Никаких runtime require'ов.

### Дополнительный fix: error logging

Добавил **try/catch** вокруг всего startup chain в App.tsx:

```typescript
useEffect(() => {
  (async () => {
    try {
      // elevation startup logic
    } catch (err) {
      console.error('[elevation startup]', err);
    }
  })();
}, []);
```

Это **defense-in-depth**: если в будущем что-то в elevation startup сломается, **остальное приложение не упадёт**. Ошибка попадёт в console.error и в DevTools, но editor отрендерится нормально. Юзер не увидит пустое окно — увидит обычное приложение с просто отсутствующим recovery offer.

## CMD-окно при UAC

Это **ожидаемое поведение dev-режима**, не баг.

В `main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
```

Атрибут `windows_subsystem = "windows"` **отключает консоль**, но он применяется **только в release** (`cfg_attr(not(debug_assertions), ...)`). В **debug** (то что запускает `npm run tauri:dev`) — атрибут не применяется, exe запускается с консолью.

Это **специально** — в dev режиме консоль нужна для `println!`, `dbg!` и другого debug output из Rust.

Когда мы делаем UAC elevation в dev mode, новый процесс — это **тот же debug exe** → консоль появляется. В **release** (`npm run tauri:build`, installed MSI) — консоли не будет.

### Можно убрать в dev?

Можно, но **не рекомендую**:
- Если уберём — потеряем визуальный debug output из Rust в dev
- В release всё равно консоли нет, продакшн юзер её никогда не увидит
- Это маленькое неудобство только в dev mode, **только при elevation flow**

Если очень захочется — можем добавить условную логику "при elevated startup, скрыть консоль через AllocConsole/FreeConsole APIs". Но это extra Rust код для cosmetic улучшения dev-only сценария. Я бы оставил как есть.

## Почему UAC сработал в dev

Хорошая новость: elevation flow **архитектурно** работает корректно. UAC promt появился, юзер согласился, новый процесс стартовал, прочитал state file. Просто потом упал на нашем баге с `require()`.

После v1.2.3 — должно работать полностью.

## Что в архиве

- `package.json`, `tauri.conf.json`, `Cargo.toml`, `SettingsModal.tsx` — версии 1.2.3
- `src/lib/elevation/elevation.ts` — убран `require()`, добавлен прямой import
- `src/app/App.tsx` — добавлен try/catch в startup chain

## Smoke test после v1.2.3

1. Создай защищённый тестовый файл (как в v1.2.0 changelog)
2. Открой в ArkD как обычный юзер
3. Edit, Ctrl+S
4. Elevation modal → Перезапустить
5. UAC promt → Yes
6. **CMD окно появится** — это ОК (dev mode)
7. **Должно появиться ArkD окно с твоим контентом** — это главное
8. В TopBar янтарный бейдж "Администратор", в title суффикс
9. Ctrl+S → файл сохранился

Если **опять** пустое окно — открой DevTools в нём (F12) → Console → пришли мне текст ошибки `[elevation startup]`. Теперь она точно попадёт в console благодаря добавленному catch.

## Урок

**ES modules и CommonJS не смешиваются.** В Vite/Webpack/Rollup всё код — ES modules. `require()` доступен только в Node.js при отсутствии ES module context. В browser — никогда.

Если есть подозрение на circular dependency — лучше **разнести модули** или использовать dynamic `import()` (асинхронный, всегда работает в ES modules), но **не `require()`**.

В моём чек-листе теперь записано: **никогда не пиши `require()` в frontend коде проекта на Vite**. Всегда `import`, при необходимости `import()` (async).

И ещё одно — **обязательно** оборачивать в try/catch любую startup-логику, которая может упасть до того как UI отрендерится. Лучше сломанная фича чем пустой экран.
