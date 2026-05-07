# GitHub-страница — финальное оформление

В архиве — всё для красивого оформления страницы репозитория и публикации релиза.

## Файлы в архиве

- `LICENSE` — MIT, copyright "Arkadiy Karanskiy (ArkD.DEV)"
- `README.md` — главный README на английском, "с лицом проекта"
- `README.ru.md` — русский вариант
- `RELEASE_NOTES_v1.0.1.md` — заготовка для GitHub Release
- `docs/screenshots/README.md` — инструкция, какие скриншоты сделать

## План на сегодня

### Шаг 1 — Распаковать архив

В корне проекта появятся 4 новых markdown-файла плюс папка `docs/screenshots/` с инструкцией.

Если у тебя уже был `README.md` (например, от Vite-стартера) — он перезапишется новой версией.

### Шаг 2 — Сделать скриншоты

Открой инструкцию `docs/screenshots/README.md` и сделай 5 скриншотов:
- `hero.png` (главный, для верха страницы)
- `light.png`, `dark.png` (тема)
- `edit.png` (split-режим)
- `display.png` (модал настроек)

Положи в `docs/screenshots/`. Без них README будет показывать "image not found" placeholder'ы.

### Шаг 3 — Закоммитить всё

```powershell
git add .
git commit -m "docs: add LICENSE, README (EN/RU), screenshots placeholder

- MIT License with copyright Arkadiy Karanskiy (ArkD.DEV)
- README.md in English (primary)
- README.ru.md in Russian
- Screenshots placeholder structure under docs/screenshots/"
git push
```

### Шаг 4 — Настроить страницу репозитория на GitHub

Зайди на https://github.com/ArkDdev/ArkD-MD-Viewer и сделай:

**4.1. About-блок** (справа на странице, рядом с шестерёнкой "About"):

- **Description**: `Fast, lightweight Markdown viewer built with Tauri 2 — installer under 4 MB.`
- **Website**: пока пусто (если будет лендинг — добавишь)
- **Topics** (теги): добавь все из этого списка по одному:
  ```
  markdown
  markdown-viewer
  markdown-editor
  tauri
  tauri-app
  rust
  react
  typescript
  vite
  windows-app
  desktop-app
  lightweight
  open-source
  ```
- ✅ Поставь галочку **"Releases"** — чтобы они были видны на главной странице
- ✅ Поставь галочку **"Packages"** если захочешь публиковать (можно потом)
- ✅ Поставь галочку **"Discussions"** — это удобный канал для feedback от пользователей

**4.2. Включить Discussions** (если стоит галочка выше):
- Settings → General → Features → Discussions → Enable

### Шаг 5 — Создать Release v1.0.1

1. Releases (на главной странице репозитория, справа) → **Draft a new release**
2. **Choose a tag** → впиши `v1.0.1` → **Create new tag** (или выбери если уже создан)
3. **Release title** → `v1.0.1 — First public release`
4. **Description** → скопируй текст из `RELEASE_NOTES_v1.0.1.md`
5. **Прикрепить файлы** (drag & drop):
   - `src-tauri\target\release\bundle\nsis\ArkD. MD Viewer_1.0.1_x64-setup.exe`
   - `src-tauri\target\release\bundle\msi\ArkD. MD Viewer_1.0.1_x64_en-US.msi`
   - `src-tauri\target\release\bundle\msi\ArkD. MD Viewer_1.0.1_x64_ru-RU.msi`
6. ✅ **Set as the latest release**
7. **Publish release**

Готово! Бейдж "release v1.0.1" в README автоматически подтянется (через shields.io API), потому что в нём указан твой репозиторий.

## Как будет выглядеть страница

Сверху — иконка M, название, описание, бейджи (release/license/platform/built-with), ссылки. Дальше — большой hero-скриншот в split-режиме.

Под ним — секции **Why ArkD?**, **Features**, **Screenshots**, **Install**, **Keyboard shortcuts**, **Tech stack**, **Build from source**, **Roadmap**, **License**, footer "Made by ArkDdev".

Структура такая, какую обычно делают для качественных open-source инструментов.

## Совет про README на двух языках

Главный — английский. Это стандарт open-source — даже если твоя основная аудитория русскоязычная, английский README расширит охват в десятки раз. У русскоговорящих ребят с GitHub нет проблем читать по-английски.

Русский — как **дополнение**, для тех, кому проще читать на родном. Ссылка `🇷🇺 Русский` сверху главного README ведёт на `README.ru.md`. И обратно тоже.

## После публикации

Когда нажмёшь "Publish release" — твой репозиторий **готов к показу миру**. Можешь расшарить ссылку:

- В русскоязычных Telegram-каналах для разработчиков
- На Reddit r/rust или r/tauriapps
- В Twitter/X с тегом #tauri
- В соответствующих Discord-серверах

Не жди вирального хита, но интересные feedback и звёзды найдутся быстро.

Удачи. 🎉
