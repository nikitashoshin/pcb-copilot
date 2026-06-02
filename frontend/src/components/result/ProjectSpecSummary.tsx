import type { ProjectSpec } from "@/types/project";

function formatList(values: string[] | undefined) {
  return values && values.length > 0 ? values.join(", ") : "-";
}

/**
 * Показывает исходные требования, из которых был получен ArchitectureResult.
 * Компонент нужен, чтобы инженер мог сверить результат с введённым ТЗ.
 */
export function ProjectSpecSummary({ spec }: { spec?: ProjectSpec | null }) {
  if (!spec) {
    return (
      <section>
        <div className="sectionTitle">
          <h2>Исходные требования проекта</h2>
          <span>ТЗ</span>
        </div>
        <dl className="requirementsGrid">
          <div>
            <dt>Исходные требования</dt>
            <dd>Исходные требования не сохранены в текущем результате.</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section>
      <div className="sectionTitle">
        <h2>Исходные требования проекта</h2>
        <span>ТЗ</span>
      </div>
      <dl className="requirementsGrid">
        <div>
          <dt>Название проекта</dt>
          <dd>{spec.projectName || "-"}</dd>
        </div>
        <div>
          <dt>Тип устройства</dt>
          <dd>{spec.deviceType || "-"}</dd>
        </div>
        <div>
          <dt>Входное питание</dt>
          <dd>{spec.power?.input || "-"}</dd>
        </div>
        <div>
          <dt>Внутренние линии питания</dt>
          <dd>{formatList(spec.power?.outputs)}</dd>
        </div>
        <div>
          <dt>Защита питания</dt>
          <dd>{spec.power?.protection ? "включена" : "выключена"}</dd>
        </div>
        <div>
          <dt>Микроконтроллер</dt>
          <dd>{spec.mcu?.family || "-"}</dd>
        </div>
        <div>
          <dt>Интерфейс программирования</dt>
          <dd>{spec.mcu?.programming || "-"}</dd>
        </div>
        <div>
          <dt>Интерфейсы</dt>
          <dd>{formatList(spec.interfaces)}</dd>
        </div>
        <div>
          <dt>Дискретные входы</dt>
          <dd>
            {spec.digitalInputs?.count ?? 0} x {spec.digitalInputs?.voltage || "-"}
          </dd>
        </div>
        <div>
          <dt>Релейные выходы</dt>
          <dd>{spec.relayOutputs?.count ?? 0}</dd>
        </div>
        <div>
          <dt>Плата</dt>
          <dd>
            {spec.board?.widthMm ?? "-"} x {spec.board?.heightMm ?? "-"} mm,{" "}
            {spec.board?.layers ?? "-"} слоя
          </dd>
        </div>
        <div>
          <dt>Среда применения</dt>
          <dd>{spec.environment || "-"}</dd>
        </div>
      </dl>
    </section>
  );
}
