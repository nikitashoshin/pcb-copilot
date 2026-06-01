# PCB Copilot Frontend

Next.js + TypeScript frontend для MVP PCB Copilot.

Frontend показывает три страницы:

- `/` - главная страница;
- `/new-project` - форма первого демонстрационного сценария;
- `/result` - результат генерации архитектуры, BoM, warnings и checkResults.

## Настройка API

Backend URL задается через переменную окружения:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:5065"
```

Если переменная не задана, используется значение по умолчанию:

```text
http://localhost:5065
```

## Запуск

Сначала запустите backend:

```powershell
cd backend
dotnet run --no-build --urls http://127.0.0.1:5065
```

Затем запустите frontend:

```powershell
cd frontend
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Frontend по умолчанию будет доступен на:

```text
http://127.0.0.1:3000
```

## Проверка сборки

```powershell
cd frontend
npm run build
```
