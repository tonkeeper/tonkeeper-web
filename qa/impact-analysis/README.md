# Impact Analysis — Web

Инструмент берёт `git diff` между двумя ветками/тегами, маппит изменённые файлы на функциональные области через `areas.json` и фильтрует `master-checklist.csv` → финальный регресс только по затронутым модулям.

## Быстрый старт

```sh
# Установить зависимости не нужно — чистый Node.js
node qa/impact-analysis/run.js --base v4.6.1 --head main
```

Вывод идёт в stdout. Чтобы сохранить файл:

```sh
node qa/impact-analysis/run.js \
  --base v4.6.1 \
  --head main \
  --out qa/regression-$(date +%Y-%m-%d).md \
  --csv-out qa/regression-$(date +%Y-%m-%d).csv
```

## Параметры

| Флаг | По умолчанию | Описание |
|---|---|---|
| `--base` | **обязателен** | Base ветка / тег / коммит |
| `--head` | `HEAD` | Head ветка / тег / коммит |
| `--checklist` | `qa/master-checklist.csv` | Путь к мастер-чеклисту |
| `--out` | stdout | Куда писать итоговый Markdown |
| `--csv-out` | — | Куда писать отфильтрованный CSV |
| `--platform` | все | Фильтр платформ: `Web`, `Desktop`, `Extension`, `Mobile`, `TWA` (через запятую) |
| `--min-prio` | `P2` | Минимальный приоритет для включения в выборку |
| `--diff-file` | — | Читать список файлов из файла вместо `git diff` (удобно для CI) |
| `--verbose` | — | Вывести маппинг файл → модуль в stderr |

### Примеры

```sh
# Только Web + Extension, только P0/P1
node qa/impact-analysis/run.js \
  --base release/4.7 \
  --head main \
  --platform Web,Extension \
  --min-prio P1

# В CI: diff из артефакта
git diff --name-only origin/main...HEAD > /tmp/diff.txt
node qa/impact-analysis/run.js \
  --base ignored \
  --diff-file /tmp/diff.txt \
  --out qa/impact-report.md
```

## Как это работает

```
git diff --name-only <base>...<head>
         │
         ▼
   areas.json           — паттерны файлов → модули
   (glob matching,
    first match wins)
         │
         ▼
  affected modules      — уникальный набор: Home, Swap, Send, ...
         │
         ▼
  master-checklist.csv  — фильтр по Module + Priority + Platform
         │
         ▼
  impact report (.md)   — сводка + таблица тест-кейсов по модулям
  filtered CSV (.csv)   — для импорта в TestRail / Notion / etc.
```

### Особые случаи

- **`_FULL_REGRESSION_`** — если изменённый файл попадает под generic-паттерн (`packages/core/src/**`, `packages/uikit/src/**`), инструмент помечает полный регресс и включает все модули. Это сигнал вручную оценить, какие компоненты реально затронуты.
- **Smoke** — всегда добавляется, если хотя бы один модуль попал в выборку.
- **Module aliases** — `DnD` автоматически включает `Settings`; `Mobile` включает `Mobile Dapp Browser`.

## Как расширять

### Добавить новый модуль

1. Добавить паттерн в `areas.json` → `patterns[]`:
   ```json
   {
     "pattern": "packages/uikit/src/components/my-feature/**",
     "modules": ["MyFeature"],
     "platformScope": "Shared"
   }
   ```
2. Добавить `"MyFeature"` в `_fullRegressionModules` (если хотим, чтобы он попадал в полный регресс).
3. Добавить тест-кейсы в `qa/master-checklist.csv` с `Module = MyFeature`.

### Обновить мастер-чеклист

`qa/master-checklist.csv` — живой документ. После каждого релиза:
- Добавляй новые кейсы для новых фич (с конкретным модулем в колонке `Module`).
- Убирай/обновляй кейсы для удалённых фич.
- Не удаляй кейсы на security-фиксы — они должны быть в регрессе всегда.

### Структура CSV

```
ID,Priority,Category,Module,Platform,PlatformScope,Title,Preconditions,Steps,Expected,Notes
```

| Колонка | Значение |
|---|---|
| `ID` | Уникальный идентификатор (SM-01, REG-B4-05, …) |
| `Priority` | P0 / P1 / P2 / P3 |
| `Category` | Smoke / Regression / Negative / Edge / State / Concurrency / Recovery / Sanity / Release / Matrix |
| `Module` | Функциональная область — **ключевое поле для фильтрации** |
| `Platform` | Список через `;`: `Web;Desktop;Extension;Mobile;TWA` |
| `PlatformScope` | Shared / Desktop-layout / Extension-only / Mobile-only / TWA-limited / Platform-specific |
| `Title` | Краткое название кейса |
| `Preconditions` | Что должно быть готово |
| `Steps` | Шаги в одну строку |
| `Expected` | Ожидаемый результат |
| `Notes` | Ссылки на код, тикеты, примечания |

## Файлы

```
qa/
  impact-analysis/
    run.js        — скрипт (plain Node.js, без сборки)
    areas.json    — маппинг файловых паттернов → модули
    README.md     — этот файл
  master-checklist.csv  — мастер-набор тест-кейсов (поддерживать актуальным)
```
