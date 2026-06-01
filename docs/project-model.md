# PCB Copilot — Project Model

## 1. Назначение модели

`ProjectSpec` — структурированное описание требований пользователя к плате.

Эта модель является центральным объектом MVP. На её основе система должна:

- подбирать функциональные блоки;
- формировать BoM;
- запускать инженерные проверки;
- формировать отчёт;
- в дальнейшем генерировать KiCad-пакет.

---

## 2. Пример ProjectSpec для первого сценария

```json
{
  "projectName": "Industrial STM32 Controller",
  "deviceType": "industrial_controller",
  "power": {
    "input": "24V DC",
    "outputs": ["5V", "3.3V"],
    "protection": true
  },
  "mcu": {
    "family": "STM32",
    "programming": "SWD"
  },
  "interfaces": ["RS-485"],
  "digitalInputs": {
    "count": 4,
    "voltage": "24V"
  },
  "relayOutputs": {
    "count": 2
  },
  "indication": ["power", "status", "communication"],
  "board": {
    "widthMm": 80,
    "heightMm": 60,
    "layers": 2
  },
  "environment": "industrial"
}
```

---

## 3. Описание полей

### 3.1. projectName

Название проекта.

Пример:

```json
"projectName": "Industrial STM32 Controller"
```

---

### 3.2. deviceType

Тип устройства.

Допустимые значения на MVP:

- `industrial_controller`;
- `iot_sensor`;
- `interface_module`;
- `power_module`.

На первом этапе основной тип:

```json
"deviceType": "industrial_controller"
```

---

### 3.3. power

Описание питания.

```json
"power": {
  "input": "24V DC",
  "outputs": ["5V", "3.3V"],
  "protection": true
}
```

Поля:

- `input` — входное питание;
- `outputs` — внутренние линии питания;
- `protection` — нужна ли защита питания.

Правила MVP:

- если `input = "24V DC"`, добавить блок `input_power_24v`;
- если `protection = true`, добавить `reverse_polarity_protection`;
- если `outputs` содержит `5V`, добавить `dc_dc_24_to_5`;
- если `outputs` содержит `3.3V`, добавить `ldo_5_to_3v3`.

---

### 3.4. mcu

Описание микроконтроллера.

```json
"mcu": {
  "family": "STM32",
  "programming": "SWD"
}
```

Поля:

- `family` — семейство микроконтроллера;
- `programming` — интерфейс программирования.

Правила MVP:

- если `family = "STM32"`, добавить `stm32_core`;
- если `programming = "SWD"`, добавить `swd_connector`.

---

### 3.5. interfaces

Список интерфейсов.

```json
"interfaces": ["RS-485"]
```

Правила MVP:

- если список содержит `RS-485`, добавить `rs485_interface`.

---

### 3.6. digitalInputs

Дискретные входы.

```json
"digitalInputs": {
  "count": 4,
  "voltage": "24V"
}
```

Поля:

- `count` — количество входов;
- `voltage` — уровень входного сигнала.

Правила MVP:

- если `count > 0` и `voltage = "24V"`, добавить `count` экземпляров блока `digital_input_24v`.

---

### 3.7. relayOutputs

Релейные выходы.

```json
"relayOutputs": {
  "count": 2
}
```

Правила MVP:

- если `count > 0`, добавить `count` экземпляров блока `relay_output`.

---

### 3.8. indication

Список элементов индикации.

```json
"indication": ["power", "status", "communication"]
```

Правила MVP:

- если список не пустой, добавить `led_indication`.

---

### 3.9. board

Ограничения платы.

```json
"board": {
  "widthMm": 80,
  "heightMm": 60,
  "layers": 2
}
```

Поля:

- `widthMm` — ширина платы в миллиметрах;
- `heightMm` — высота платы в миллиметрах;
- `layers` — количество слоёв.

---

### 3.10. environment

Среда применения.

```json
"environment": "industrial"
```

На MVP используется для генерации предупреждений, например:

- необходимость проверки EMC;
- необходимость защиты интерфейсов;
- необходимость проверки температурного режима;
- необходимость ручной инженерной проверки.

---

## 4. Модель ArchitectureResult

Backend должен возвращать результат в следующем виде:

```json
{
  "projectName": "Industrial STM32 Controller",
  "functionalBlocks": [
    {
      "code": "input_power_24v",
      "name": "24V DC Power Input",
      "quantity": 1,
      "category": "power",
      "description": "Input power block for 24V DC industrial supply."
    }
  ],
  "bom": [
    {
      "reference": "J1",
      "name": "Power input connector",
      "type": "connector",
      "value": "2-pin",
      "package": "Terminal block",
      "footprint": "TerminalBlock_2pin",
      "quantity": 1,
      "comment": "Input power connector",
      "blockCode": "input_power_24v"
    }
  ],
  "warnings": [
    {
      "code": "CHECK_RELAY_LOAD_CURRENT",
      "severity": "Warning",
      "message": "Check relay load current and contact rating before production."
    }
  ],
  "checkResults": [
    {
      "code": "STM32_REQUIRES_3V3",
      "title": "STM32 requires 3.3V supply",
      "severity": "Error",
      "status": "Passed",
      "message": "3.3V rail is present.",
      "recommendation": "Verify regulator current and decoupling capacitors.",
      "relatedBlockCode": "stm32_core"
    }
  ]
}
```

---

## 5. Принцип проектирования модели

Модель должна быть:

- простой;
- расширяемой;
- удобной для backend-валидации;
- независимой от KiCad;
- пригодной для генерации разных выходных форматов.

Не нужно привязывать бизнес-логику напрямую к KiCad-файлам. Сначала формируется независимая JSON-модель, затем из неё можно генерировать:

- архитектуру;
- BoM;
- отчёт;
- KiCad-пакет;
- в будущем Altium-скрипт или другой экспорт.
