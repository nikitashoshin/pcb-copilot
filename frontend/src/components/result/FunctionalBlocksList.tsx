import type { BlockRationaleItem, FunctionalBlockResult } from "@/types/project";

const categoryLabels: Record<string, string> = {
  power: "Питание",
  protection: "Защита",
  mcu: "Микроконтроллер",
  debug: "Отладка и программирование",
  interface: "Интерфейсы",
  input: "Входы",
  output: "Выходы",
  indication: "Индикация",
  connector: "Разъёмы",
};

const blockLabels: Record<string, string> = {
  input_power_24v: "Вход питания 24 В DC",
  reverse_polarity_protection: "Защита от переполюсовки",
  dc_dc_24_to_5: "DC/DC-преобразователь 24 В → 5 В",
  ldo_5_to_3v3: "LDO-стабилизатор 5 В → 3,3 В",
  stm32_core: "Ядро STM32",
  swd_connector: "Разъём SWD",
  rs485_interface: "Интерфейс RS-485",
  digital_input_24v: "Дискретный вход 24 В",
  relay_output: "Релейный выход",
  led_indication: "Светодиодная индикация",
  connectors: "Разъёмы и клеммники",
};

function displayBlockName(code: string, fallback: string) {
  return blockLabels[code] ?? fallback;
}

/**
 * Показывает функциональные узлы по инженерным категориям.
 * Английские blockCode остаются вторичными техническими идентификаторами API.
 */
export function FunctionalBlocksList({
  blocks,
  rationale,
}: {
  blocks: FunctionalBlockResult[];
  rationale?: BlockRationaleItem[];
}) {
  const groups = blocks.reduce<Record<string, FunctionalBlockResult[]>>((result, block) => {
    result[block.category] ??= [];
    result[block.category].push(block);
    return result;
  }, {});

  return (
    <section className="dashboardSection" id="blocks">
      <div className="dashboardSectionHeading">
        <div>
          <p className="sectionKicker">Архитектура платы</p>
          <h2>Функциональные узлы платы</h2>
        </div>
        <span>{blocks.length} типов</span>
      </div>

      <div className="blockCategoryList">
        {Object.entries(groups).map(([category, categoryBlocks]) => (
          <div className="blockCategory" key={category}>
            <div className="blockCategoryHeading">
              <h3>{categoryLabels[category] ?? category}</h3>
              <span>{categoryBlocks.length}</span>
            </div>
            <div className="compactBlockGrid">
              {categoryBlocks.map((block) => (
                <article className="compactBlockCard" key={block.code}>
                  <div>
                    <h4>{displayBlockName(block.code, block.name)}</h4>
                    <small>{block.name}</small>
                  </div>
                  <strong>x{block.quantity}</strong>
                  <code>{block.code}</code>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      {rationale && rationale.length > 0 && (
        <details className="detailsPanel blockRationalePanel">
          <summary>
            <span>Почему выбраны эти узлы</span>
            <b>{rationale.length}</b>
          </summary>
          <ul className="reviewRationaleList">
            {rationale.map((item) => (
              <li key={item.blockCode}>
                <div>
                  <strong>{displayBlockName(item.blockCode, item.blockName)}</strong>
                  <code>{item.blockCode}</code>
                </div>
                <p>{item.reason}</p>
                <small>{item.relatedRequirement}</small>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
