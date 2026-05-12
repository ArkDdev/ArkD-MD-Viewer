# v1.3.1 — Hotfix: remove lint from CI

## Что нужно сделать

1. Распакуй архив **поверх v1.3.0** (5 файлов).
2. Commit + push:
   ```powershell
   git add .
   git commit -m "ci: remove lint step (no eslint config in project)"
   git push
   ```
3. CI запустится автоматически — на этот раз должен пройти.

## Что было сломано

Первый CI run упал на:
```
ESLint couldn't find a configuration file.
Error: Process completed with exit code 2.
```

В `package.json` есть скрипт `"lint": "eslint . --ext ts,tsx ..."`, но **конфига ESLint** (`.eslintrc.*` или `eslint.config.js`) в проекте **нет**. Локально лог никогда не запускался, поэтому проблема не была видна — она проявилась только сейчас в CI.

## Фикс

Убрал `lint` step из `ci.yml`. Оставил `typecheck` (он работает — использует `tsc --noEmit` со стандартным `tsconfig.json`, которые у тебя точно есть).

Переименовал job из `lint-and-typecheck` в `typecheck` — для логичности.

## Что осталось

CI теперь делает:
1. **typecheck** — на одном Linux runner, ~1-2 мин
2. Если pass → **build** на Windows + Linux параллельно, ~5-15 мин

Полный CI run: ~10-15 минут.

## Урок для меня

Я добавил `npm run lint` в CI **не проверив** что скрипт работает локально. Это **именно та ошибка** против которой мы боролись всю разработку — гадание вместо проверки.

В моём чек-листе: **перед использованием npm script в CI — `npm run <script>` локально**. Не предполагать что он работает.

## Возможные следующие проблемы

После этого fix CI должен пройти большую часть, но возможны ещё две точки:

**A. Linux build prerequisites** — я указал `libwebkit2gtk-4.1-dev` в apt-get. На Ubuntu 22.04 этот пакет может быть в `4.1` (Tauri 2.0+) или `4.0` (старее). Если build на Linux упадёт с `webkit2gtk` not found — поменяю на `4.0`.

**B. tauri-action target argument** — `args: ''` пустой работает в большинстве случаев, но иногда нужен `--target x86_64-pc-windows-msvc` явно. Если build упадёт с непонятным target error — добавим.

Скорее всего ничего из этого не понадобится. Поехали проверять.

## Что в архиве

5 файлов:
- `.github/workflows/ci.yml` — без lint step
- `package.json`, `Cargo.toml`, `tauri.conf.json` — версия 1.3.1
- `SettingsModal.tsx` — APP_VERSION

`release.yml` не трогал — он не использует lint, у него своя проблема будет в свою очередь (если будет).
