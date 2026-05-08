# v1.0.3 — Unsaved changes guard

## Что нужно сделать

1. Распакуй архив поверх проекта (15 файлов).
2. **Перезапусти `npm run tauri:dev`**.
3. Это **затрагивает Rust capabilities** (`default.json`) — нужен **полный перезапуск**, не просто hot-reload. После рестарта Cargo пересоберёт capabilities в gen/, это секунд 10-15.

## Что добавлено

Защита от **потери несохранённых изменений** во всех destructive actions:

- ✅ Меню → "Новый файл" (Ctrl+N)
- ✅ Меню → "Открыть" (Ctrl+O)
- ✅ Drag & drop файла на окно
- ✅ Двойной клик на .md в Explorer (когда приложение уже открыто)
- ✅ Закрытие окна (X-кнопка, Alt+F4) — **в этом релизе**

Всегда — **3 кнопки в стиле VS Code**: Сохранить / Не сохранять / Отмена.

## Поведение модала

**Заголовок:** "Несохранённые изменения" (RU) / "Unsaved changes" (EN)

**Описание:**
- Если файл имеет путь: «Файл "имя_файла" содержит несохранённые изменения. Что сделать?»
- Если буфер без пути (новый документ с правками): «Документ содержит несохранённые изменения. Что сделать?»

**Кнопки** (порядок справа налево, как в VS Code):
- **Сохранить** — primary, autoFocus, terracotta. Реакция:
  - Если у файла есть путь → пишет в этот путь, потом продолжает destructive action
  - Если пути нет → показывает Save As dialog. Если юзер **отменяет Save As** → весь guard трактуется как Cancel, destructive action отменяется.
- **Не сохранять** — destructive style (hover красный). Сразу продолжает destructive action.
- **Отмена** — neutral. Возвращает в редактирование.

**Клавиши:**
- `Escape` → Cancel (безопасный default)
- `Enter` → Save (по autoFocus на этой кнопке)

## Архитектура

### Promise-based guard

Главное архитектурное решение. В `src/lib/unsavedGuard.ts`:

```ts
const choice = await confirmDiscard(); // 'save' | 'discard' | 'cancel'
```

Вызов возвращает Promise, который резолвится когда пользователь кликает кнопку. Это даёт **линейный читаемый flow** в каждом callsite, без callback-ада.

Внутренне: zustand store с одним полем `resolver`. Когда `confirmDiscard()` вызван, сохраняет resolver в store → модал рендерится → клик кнопки вызывает resolver → store очищается → Promise разрешается → код продолжается.

### Helper `guardDirtyBuffer()`

В `src/lib/fs/guard.ts`. Один helper для всех destructive actions:

```ts
const handleNew = async () => {
  if (!(await guardDirtyBuffer())) return;
  // proceed with destructive action
};
```

Внутри:
1. Если буфер чистый → сразу `true` (нечего терять)
2. Иначе → `confirmDiscard()` → ждать выбора
3. На 'save' — попытаться сохранить (с Save As если нужно), вернуть `true` при успехе
4. На 'discard' — `true`
5. На 'cancel' — `false`

Все 5 destructive actions используют этот helper:
- MenuButton.handleNew
- MenuButton.handleOpen
- shortcuts.ts (Ctrl+N, Ctrl+O)
- dragDrop.ts (drop event)
- openHandler.ts (file-open event)
- closeGuard.ts (window close-requested event)

### Window close interception

`src/lib/window/closeGuard.ts` использует Tauri 2 API `window.onCloseRequested`:

1. Юзер кликает X (наша кастомная кнопка вызывает `windowControls.close()` → Tauri пробрасывает `close-requested`)
2. Listener делает `event.preventDefault()` синхронно
3. Запускает guard асинхронно
4. Если guard вернул `true` → `window.destroy()` (закрывает окно в обход новых событий)
5. Если `false` → ничего не делаем, окно остаётся

Это работает и для системного X-close (Alt+F4, X в title bar если бы он был системным), и для нашей кастомной кнопки.

**Зачем `destroy` а не `close`:** `close()` опять триггерит `close-requested`, мы получим бесконечный цикл. `destroy()` обходит event и закрывает безусловно.

Capabilities добавлен `core:window:allow-destroy`.

## Edge cases которые обработаны

- **Cancel в Save As при пустом буфере** → возвращаемся в редактор, destructive action отменена
- **Save fails** (readonly, нет места) → guard возвращает false, destructive action отменена, ошибка в console
- **Двойной клик на X (close)** → флаг `closing` в closeGuard защищает от запуска второго guard'а параллельно
- **Stacked confirmDiscard** → если уже есть открытый guard и кто-то ещё запрашивает — новый сразу резолвится с 'cancel' (избегает двух модалов поверх друг друга)
- **Watcher silent reload** → НЕ трогает guard. Watcher же тихо подменяет content, юзер этого не заметит — никаких confirms.
- **Conflict modal "Загрузить обновлённый"** → НЕ трогает guard. Это уже сама конфликт-логика.
- **Initial launch с file argument** → НЕ трогает guard. Welcome doc по определению чистый.

## Чек-лист smoke test

### Базовая защита

1. Открой какой-то файл
2. Поправь — точка `●` появится в title bar
3. **"Новый файл"** через бургер-меню → должен появиться модал
4. Жмёшь **Отмена** → возвращаемся к файлу, изменения на месте ✓
5. Опять "Новый файл" → модал → жмёшь **Не сохранять** → буфер очищен, ушёл в split ✓
6. Поправь что-то в новом буфере (теперь без пути)
7. Бургер → "Открыть" → модал → **Сохранить** → должен открыться **Save As** → выбираешь имя → файл сохранён, ПОТОМ открывается Open dialog
8. В Save As нажми **Cancel** → guard трактует как Cancel, destructive action отменена ✓

### Хоткеи

- [ ] Ctrl+N с грязным буфером → модал
- [ ] Ctrl+O с грязным буфером → модал

### Drag & Drop

- [ ] Открой файл, поправь, перетащи другой .md → модал → выбор работает корректно

### Закрытие окна

- [ ] Открой файл, поправь
- [ ] Жмёшь X в правом верхнем углу → модал
- [ ] **Отмена** → окно осталось ✓
- [ ] Опять X → **Не сохранять** → окно закрылось ✓
- [ ] Запусти приложение, поправь буфер, жми Alt+F4 → модал ✓
- [ ] Двойной клик по X → один модал, не два ✓

### Save с путём

- [ ] Открой существующий файл, поправь
- [ ] X → модал → Сохранить → файл сохранён, окно закрылось ✓ (без Save As)

### Watcher не должен ломать

- [ ] Открой файл, переключись в edit, начни печатать (буфер dirty)
- [ ] Поменяй файл во внешнем редакторе и сохрани
- [ ] Должен показаться **conflict modal** (не unsaved-changes!) — мы знаем что в edit + dirty это сценарий конфликта
- [ ] "Оставить мои изменения" → буфер всё ещё dirty
- [ ] Теперь жми X → unsaved-changes modal ✓ (потому что conflict уже отработан, теперь обычный destructive flow)

### Не должно показываться при чистом буфере

- [ ] Открой файл, не правь
- [ ] X → окно закрывается без модала ✓
- [ ] Welcome doc → "Новый файл" → без модала (welcome не считается dirty) ✓

## Размер

- Новый код: ~3 КБ JS
- Никаких новых зависимостей

## Что дальше

После теста v1.0.3 — переходим к **v1.1.0: поддержка не-md файлов**. Это будет крупная итерация с архитектурными решениями (определение типа файла, lazy-loading lang-grammar для CodeMirror, скрытие edit/preview-toggle для не-markdown).
