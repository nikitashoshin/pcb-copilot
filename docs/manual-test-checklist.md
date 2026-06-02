# Manual Test Checklist

## ZIP-export проекта

- Открыть страницу `/result` с уже сформированным результатом архитектуры.
- Нажать кнопку «Скачать ZIP-пакет проекта».
- Убедиться, что скачан файл `.zip`.
- Открыть архив и проверить наличие `project-spec.json`.
- Проверить наличие `bom.csv`.
- Проверить наличие `engineering-report.md`.
- Проверить наличие папки `kicad`.
- В папке `kicad` проверить наличие `README-KiCad.md`.
- В папке `kicad` проверить наличие `industrial-stm32-controller.kicad_pro`.
- В папке `kicad` проверить наличие `industrial-stm32-controller.kicad_sch`.
- В папке `kicad` проверить наличие `industrial-stm32-controller.kicad_pcb`.
- Убедиться, что `README-KiCad.md` содержит предупреждение о ручной инженерной проверке и о том, что KiCad-файлы не являются готовой платой.
