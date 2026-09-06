# PCB Copilot · Backend

ASP.NET Core Minimal API на .NET 8. Принимает требования к плате, формирует архитектурный черновик и экспортирует результат в CSV, Markdown и ZIP.

[Обзор проекта и полный запуск](../README.md)

## Запуск

Требуется **.NET 8 SDK**. Из корня репозитория:

```powershell
cd backend
dotnet restore
dotnet run --urls http://127.0.0.1:5065
```

`dotnet run` выполняет сборку. Флаг `--no-build` можно использовать только после успешной сборки соответствующей конфигурации.

- [Swagger UI](http://127.0.0.1:5065/swagger) — описание API и отправка запросов из браузера.
- [Пример требований](http://127.0.0.1:5065/api/projects/sample) — `ProjectSpec` базового сценария.

База данных, внешние AI API и KiCad для запуска не требуются.

## Сборка и публикация

Из каталога `backend`:

```powershell
dotnet build -c Release
dotnet publish -c Release
```

Файл `Data/functional-blocks.json` должен быть доступен относительно content root приложения. Для запуска опубликованной версии перейдите в каталог публикации и выполните:

```powershell
dotnet PcbCopilot.Backend.dll --urls http://127.0.0.1:5065
```

## HTTP API

Все project endpoints имеют префикс `/api/projects`. JSON использует `camelCase`.

| Метод | Путь | Тело запроса | Ответ |
| --- | --- | --- | --- |
| GET | `/sample` | — | Пример `ProjectSpec` |
| POST | `/validate` | `ProjectSpec` | `ValidationResult`: `isValid` и список `issues` |
| POST | `/generate-architecture` | `ProjectSpec` | `ArchitectureResult` |
| POST | `/export-bom-csv` | `ArchitectureResult` | CSV с UTF-8 BOM |
| POST | `/generate-report` | `ArchitectureResult` | Markdown-отчёт |
| POST | `/export-package` | `ArchitectureResult` | ZIP с требованиями, BoM, отчётом и KiCad-заготовками |

Для проверки через Swagger получите пример из `/sample`, отправьте его в `/validate`, затем в `/generate-architecture`. Полученный `ArchitectureResult` можно передать любому endpoint экспорта.

Валидация и генерация сейчас являются независимыми запросами. `/validate` возвращает HTTP 200 также при обнаружении ошибок требований — проверяйте `isValid` и `issues`. Frontend выполняет эту проверку перед генерацией; сам `/generate-architecture` пока не вызывает валидатор.

Экспорт принимает полный результат от клиента. Сервер не хранит проекты и не восстанавливает их по идентификатору.

## Организация кода

| Файл или каталог | Ответственность |
| --- | --- |
| [Program.cs](Program.cs) | Сборка приложения, JSON, Swagger, CORS и маршруты |
| [Infrastructure/ServiceCollectionExtensions.cs](Infrastructure/ServiceCollectionExtensions.cs) | Регистрация сервисов через DI и политика CORS |
| [Endpoints/ProjectEndpoints.cs](Endpoints/ProjectEndpoints.cs) | HTTP-контракт |
| [Models/](Models/) | C# records для требований, архитектуры, BoM, проверок и инженерного анализа |
| [Services/ProjectValidator.cs](Services/ProjectValidator.cs) | Базовая валидация требований |
| [Services/ArchitectureGenerator.cs](Services/ArchitectureGenerator.cs) | Выбор блоков, количества компонентов и проверки результата |
| [Services/EngineeringReviewGenerator.cs](Services/EngineeringReviewGenerator.cs) | Недостающие параметры, обоснования, риски и обзор ресурсов |
| [Services/FunctionalBlockCatalog.cs](Services/FunctionalBlockCatalog.cs) | Загрузка каталога и поиск по коду блока |
| [Services/BomCsvExporter.cs](Services/BomCsvExporter.cs) | Перечень компонентов в CSV |
| [Services/MarkdownReportGenerator.cs](Services/MarkdownReportGenerator.cs) | Инженерный отчёт |
| [Services/ProjectPackageExporter.cs](Services/ProjectPackageExporter.cs) | ZIP и стартовые файлы KiCad |

## Каталог и правила генерации

[Data/functional-blocks.json](Data/functional-blocks.json) содержит 11 типов функциональных блоков. Для каждого указаны код, категория, описание, компоненты и стандартные предупреждения.

Правила выбора находятся в `ArchitectureGenerator`: например, `5V` добавляет DC/DC 24→5 В, а `digitalInputs.count` задаёт количество экземпляров входного блока при уровне `24V`. При построении BoM количество каждого компонента умножается на количество экземпляров блока.

Добавление записи в JSON само по себе не создаёт новый поддерживаемый сценарий: нужно также согласовать правила выбора, валидацию и инженерный анализ. Каталог загружается при создании singleton-сервиса; после изменения JSON перезапустите API.

## Локальная конфигурация

CORS разрешает frontend с origin `http://127.0.0.1:3000`. Настройка находится в `AddFrontendCors`; другой адрес или порт frontend потребует изменения этой политики.

Swagger включён во всех окружениях. Авторизация в текущем MVP не реализована.

## Проверка и ограничения

Автоматические тесты пока не добавлены. Ручные сценарии описаны в [чек-листе](../docs/manual-test-checklist.md).

BoM и инженерный анализ являются предварительными. KiCad-файлы содержат стартовую структуру, текстовые пояснения и контур платы; полноценная схема, соединения и трассировка не генерируются. Остальные ограничения и планы собраны в [главном README](../README.md#текущие-ограничения).
