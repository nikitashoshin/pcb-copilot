# PCB Copilot Backend

.NET 8 Web API для MVP PCB Copilot. Backend принимает `ProjectSpec`, подбирает функциональные блоки для первого сценария, формирует черновой BoM, инженерные предупреждения и базовые проверки.

В этом MVP нет базы данных, авторизации, генерации KiCad-файлов и автоматической трассировки.

## Запуск

```powershell
cd backend
dotnet restore --ignore-failed-sources
dotnet run
```

Swagger UI будет доступен по адресу:

```text
http://localhost:5000/swagger
```

Если `dotnet run` выберет другой порт, он будет указан в выводе команды.

## Endpoints

- `GET /api/projects/sample` - возвращает пример `ProjectSpec` для сценария STM32 + 24 В + RS-485 + 4 дискретных входа + 2 релейных выхода + 80 x 60 мм.
- `POST /api/projects/generate-architecture` - принимает `ProjectSpec` и возвращает `ArchitectureResult`.

## Справочник блоков

Функциональные блоки хранятся в JSON-файле:

```text
Data/functional-blocks.json
```

BoM формируется на основе выбранных блоков. Если блок используется несколько раз, например `digital_input_24v x4` или `relay_output x2`, количества компонентов умножаются на количество экземпляров блока.
