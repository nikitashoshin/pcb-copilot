import type { ProjectSpec } from "@/types/project";

function formatList(values: string[] | undefined) {
  return values && values.length > 0 ? values.join(", ") : "-";
}

function deviceTypeLabel(value: string | undefined) {
  return value === "industrial_controller" ? "Промышленный контроллер" : value || "-";
}

function environmentLabel(value: string | undefined) {
  return value === "industrial" ? "Промышленная" : value || "-";
}

/**
 * Показывает исходные требования, из которых был получен ArchitectureResult.
 * Требования доступны в обзоре, но свёрнуты по умолчанию, чтобы не удлинять dashboard.
 */
export function ProjectSpecSummary({ spec }: { spec?: ProjectSpec | null }) {
  return (
    <details className="detailsPanel requirementsPanel">
      <summary>
        <span>Исходные требования проекта</span>
        <b>ТЗ</b>
      </summary>

      {!spec ? (
        <p className="mutedText">Исходные требования не сохранены в текущем результате.</p>
      ) : (
        <dl className="requirementsGrid">
          <div>
            <dt>Название проекта</dt>
            <dd>{spec.projectName || "-"}</dd>
          </div>
          <div>
            <dt>Тип устройства</dt>
            <dd>{deviceTypeLabel(spec.deviceType)}</dd>
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
              {spec.board?.widthMm ?? "-"} x {spec.board?.heightMm ?? "-"} мм,{" "}
              {spec.board?.layers ?? "-"} слоя
            </dd>
          </div>
          <div>
            <dt>Среда применения</dt>
            <dd>{environmentLabel(spec.environment)}</dd>
          </div>
        </dl>
      )}
    </details>
  );
}
