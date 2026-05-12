# v1.3.0 — GitHub Actions for multi-platform builds

## Что нужно сделать

1. Распакуй архив **поверх v1.2.4** (8 файлов).
2. Сделай коммит и пуш:
   ```powershell
   git add .
   git commit -m "ci: add GitHub Actions for release and CI builds"
   git push
   ```
3. После пуша **CI** запустится автоматически — проверяй вкладку Actions на GitHub.
4. Когда захочешь сделать релиз — `git tag v1.3.0 && git push --tags`. Release workflow создаст draft Release с installer'ами.

## Что добавлено

Два workflow в `.github/workflows/`:

### `release.yml` — релиз по тегу

**Триггер:** `git push --tags` с тегом вида `v*.*.*`

**Что делает:**
1. Запускает **матрицу из двух runner'ов** параллельно: `windows-latest`, `ubuntu-22.04`
2. На каждом устанавливает Node 20, Rust stable, Linux build deps (для ubuntu)
3. Кэширует `node_modules` и Rust `target/` — последующие сборки быстрее
4. Через **`tauri-apps/tauri-action@v0`** собирает installers согласно `tauri.conf.json`:
   - Windows: `.msi` (WiX) + `.exe` (NSIS)
   - Linux: `.AppImage` (portable) + `.deb` (Debian/Ubuntu)
5. Создаёт **draft GitHub Release** с этими installers как assets
6. Release **остаётся в draft статусе** — ты заходишь на github.com → Releases → редактируешь description (например копипастишь из CHANGES.md) → нажимаешь Publish

**Время одного релиза:** ~10-15 минут (Linux ~5 мин, Windows ~10 мин, параллельно)

**Стоимость:** для public repos на GitHub Actions всё **бесплатно** для Linux runners, Windows стоит 2× минут от бесплатного лимита 2000/мес. Один release ≈ 12 минут counted. **Можно делать ~150 релизов в месяц** до упирания в лимит.

### `ci.yml` — проверка на PR и push в main

**Триггер:** PR в main, push в main, **кроме** push тегов (release.yml их обслуживает).

**Что делает:**
1. Сначала **lint + typecheck** на одном Linux runner — быстро (~1-2 минуты)
2. **Если они прошли** — запускает full build на Windows + Linux (тоже параллельно)
3. **Артефакты не публикуются** — это просто проверка "собирается ли"

**Concurrency control:** если ты пушишь новый коммит в PR пока CI ещё бежит на старом — старый run **отменяется**. Не тратим минуты впустую.

**Time-saver:** `needs: lint-and-typecheck` для build job. Если линт упал, full build даже не запускается. Дешёвые проверки фильтруют до того как тратить minutes на Windows runner.

## Архитектурные решения

### Почему ubuntu-22.04, а не ubuntu-latest

`ubuntu-latest` сейчас = 22.04, но GitHub меняет это **без предупреждения** (так было с 20.04 → 22.04 в 2023). Когда поменяется на 24.04 — наш build может сломаться (новые glibc, новые WebKit). Pinned 22.04 гарантирует **predictable builds**.

Также важно для ABI: бинарь собранный на старом glibc работает на новых системах, **но не наоборот**. 22.04 даёт glibc 2.35 — это разумный baseline для desktop Linux 2024-2025.

### Почему windows-latest без pin

Windows-runners по большей части ABI-stable между релизами — Win32 API не меняется, MSVC обновляется обратно-совместимо. Pinning не даёт значимой стабильности, а минусом было бы не получать обновления секурности. Оставил `latest`.

### Почему `tauri-apps/tauri-action@v0`

Это **официальный** action от Tauri team. Знает все тонкости:
- Запускает `npm run tauri build` правильно
- Подхватывает все bundles (`targets: "all"` в config)
- Загружает artifacts в Release с правильными именами

Альтернатива — писать всё руками (`npm ci`, `npm run tauri build`, `actions/upload-release-asset`). Это **~50 лишних строк YAML** ради нулевого выигрыша. Использовать официальное действие — здравый smysl.

### Почему release как DRAFT

Юзеры **не увидят** release пока ты не нажмёшь Publish на github.com. Это даёт время:
- Скачать installer и проверить вручную
- Дописать release notes (выжимку из CHANGES.md)
- Передумать и **удалить релиз** если что-то поломалось

Если ты уверен в своём процессе — поменяешь `releaseDraft: true` на `false`, и release станет public сразу после build.

### Почему макрос `concurrency` только в ci.yml, не в release.yml

Тег — это **explicit ship signal**. Если ты случайно запушил `v1.3.0` и сразу же `v1.3.1` — оба должны собраться, оба попасть в Releases. Cancellation тут вредно.

В CI наоборот — несколько коммитов подряд в один PR это нормально, и нет смысла собирать **каждый** промежуточный коммит. Cancel-in-progress правильно.

### Почему `permissions: contents: write`

GitHub Actions с 2023 года использует **least-privilege** по умолчанию — workflow видит репо, но не может его менять. Чтобы создать Release нужно явно запросить `contents: write`. Это **минимальное** разрешение для нашей задачи.

## Что не делаем (пока)

1. **Code signing.** Решили начать без подписи. Это значит:
   - **Windows**: SmartScreen покажет warning "Don't run" → юзер жмёт "More info → Run anyway". Можно добавить позже через GitHub secret + блок в release.yml.
   - **Linux**: подпись не требуется, AppImage и deb работают как есть.

2. **macOS.** Скипнули по твоему решению. Можно добавить позже — нужно расширить matrix `release.yml` и `ci.yml` строчкой `- platform: macos-latest`. Linux deps install шаг при этом скипнется автоматически (`if: matrix.platform == 'ubuntu-22.04'`).

3. **Notarization (macOS).** Apple-специфичная штука для разрешения запуска. Только если решишь делать macOS-релизы.

4. **Auto-update сервер.** Tauri имеет `tauri-plugin-updater` — приложение само проверяет обновления и предлагает скачать. Это отдельная серьёзная фича — не в этой итерации.

## Файлы

**Новые:**
- `.github/workflows/release.yml`
- `.github/workflows/ci.yml`

**Изменены:**
- `package.json`, `Cargo.toml`, `tauri.conf.json` — версия 1.3.0
- `SettingsModal.tsx` — APP_VERSION
- `README.md`, `README.ru.md` — обновлены badges (добавлен CI badge, "platforms: Windows | Linux")

## Smoke test

### Сразу после commit + push

1. Push коммит → GitHub Actions автоматически запустит **CI workflow**
2. Заходи в **GitHub → ваш repo → Actions tab**
3. Должен увидеть "CI" run, статус running
4. Ждёшь ~10 минут — должен закончиться зелёным ✓
5. Если красный — заходи в run, смотри логи. Скорее всего что-то с node_modules или Rust deps; пришли мне error message

### Первый release

1. Обнови версию в локальных файлах если нужно (скажем v1.3.1, или оставляй v1.3.0)
2. `git tag v1.3.0`
3. `git push --tags`
4. GitHub Actions → запустится **Release workflow** (значок workflow_name = "Release")
5. Ждёшь ~15 минут
6. Когда закончит — заходи **GitHub → Releases**
7. Должен видеть **"ArkD MD Viewer v1.3.0"** в статусе **Draft**
8. Раскрываешь — видишь attached assets:
   - `ArkD.MD.Viewer_1.3.0_x64_en-US.msi`
   - `ArkD.MD.Viewer_1.3.0_x64-setup.exe` (NSIS)
   - `ArkD.MD.Viewer_1.3.0_amd64.AppImage`
   - `ArkD.MD.Viewer_1.3.0_amd64.deb`
9. Скачай **Windows .msi** для теста elevation flow (то что ты собирался делать)
10. Установи, запусти ArkD, попробуй edit защищённого файла, UAC flow
11. Если работает — заходи на release page → нажми **Publish**. Release становится public.

### CI на следующих PR

Когда сделаешь PR (или просто push в main), CI запустится автоматически. Можно настроить branch protection rules в Settings → Branches: "Require CI to pass before merging" — это блокирует merge broken кода.

## Известные ограничения

1. **Build time без cache** — первый release займёт ~25 минут (Rust компилирует много зависимостей). Дальше с cache — 10-15 минут. Cache хранится 7 дней без обращений, потом удаляется.

2. **Linux runners** GitHub бесплатные для public repos, **Windows стоит 2×**. С нашей частотой релизов (несколько в месяц) — без проблем. Если будут tens of releases — посмотри в Settings → Billing → Spending limits.

3. **`tauri-action@v0`** — pinned на v0, ловит все patch-обновления внутри major. Если когда-то выйдет v1 с breaking changes — нужно обновить manually.

4. **AppImage / DEB на старых дистрибутивах**. AppImage built на ubuntu-22.04 (glibc 2.35) не запустится на Ubuntu 20.04 (glibc 2.31). Это редкий кейс — большинство юзеров на 22.04+ к 2025. Если станет проблемой — можно собирать на 20.04 (для совместимости).

5. **Release.yml игнорирует** `tags-ignore` в `ci.yml` — намеренно. Tags идут через release.yml, branches идут через ci.yml. **Нет** двойной сборки на тегах.

## Что в итоге у нас есть

После v1.3.0 это **полностью production-ready** проект:
- ✅ 12 форматов файлов с подсветкой
- ✅ Any-file open as text
- ✅ UAC elevation для защищённых файлов
- ✅ Темы, i18n, settings
- ✅ Drag&drop с size/binary warnings
- ✅ File watcher, unsaved guards
- ✅ Размеренная подсветка (custom INI parser, и т.д.)
- ✅ **Multi-platform CI/CD** через GitHub Actions

Поздравляю! Это **серьёзный, полный проект**. Можно публиковать в Releases и делиться с миром.

## Что дальше (за рамками изначального плана)

Если когда-нибудь захочется расширять:
- Code signing для Windows / macOS
- macOS support (один-два runner в matrix)
- Auto-updater через `tauri-plugin-updater`
- Find & replace
- TOC sidebar
- Recent files

Но это всё — **отдельные** проекты. Текущий цикл разработки закрыт.
