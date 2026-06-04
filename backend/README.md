# PCB Copilot Backend

.NET 8 Web API для MVP PCB Copilot. Backend принимает `ProjectSpec`, подбирает функциональные блоки для первого сценария, формирует черновой BoM, инженерные предупреждения, базовые проверки и структурированный предварительный инженерный анализ.

В этом MVP нет базы данных, авторизации, production-ready генерации KiCad-файлов и автоматической трассировки. ZIP-экспорт содержит только черновые placeholder-заготовки для ручной инженерной доработки.

## Запуск

```powershell
cd backend
dotnet restore --ignore-failed-sources
dotnet run --no-build --urls http://127.0.0.1:5065
```

Swagger UI будет доступен по адресу:

```text
http://127.0.0.1:5065/swagger
```

## Endpoints

- `GET /api/projects/sample` - возвращает пример `ProjectSpec` для сценария STM32 + 24 В + RS-485 + 4 дискретных входа + 2 релейных выхода + 80 x 60 мм.
- `POST /api/projects/validate` - принимает `ProjectSpec` и возвращает результат базовой валидации.
- `POST /api/projects/generate-architecture` - принимает `ProjectSpec` и возвращает `ArchitectureResult`.
- `POST /api/projects/export-bom-csv` - принимает `ArchitectureResult` и возвращает BoM в CSV.
- `POST /api/projects/generate-report` - принимает `ArchitectureResult` и возвращает Markdown-отчет.
- `POST /api/projects/export-package` - принимает `ArchitectureResult` и возвращает ZIP-пакет с `project-spec.json`, `bom.csv`, `engineering-report.md` и черновыми KiCad-заготовками.

ZIP-пакет содержит placeholder-файлы KiCad. Это не готовая схема, не готовая трассировка и не производственный проект платы.

## Справочник блоков

Функциональные блоки хранятся в JSON-файле:

```text
Data/functional-blocks.json
```

BoM формируется на основе выбранных блоков. Если блок используется несколько раз, например `digital_input_24v x4` или `relay_output x2`, количества компонентов умножаются на количество экземпляров блока.
