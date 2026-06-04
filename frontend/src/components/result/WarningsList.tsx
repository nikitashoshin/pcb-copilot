import type { EngineeringWarning } from "@/types/project";
import { severityClass } from "./result-formatting";

/**
 * Показывает подробные предупреждения backend как техническую детализацию результата.
 * Код предупреждения остаётся вторичным идентификатором, а сообщение становится главным текстом.
 */
export function WarningsList({ warnings }: { warnings: EngineeringWarning[] }) {
  return (
    <div className="detailPanel">
      <div className="subsectionHeading">
        <h3>Инженерные предупреждения</h3>
        <span>{warnings.length}</span>
      </div>
      <ul className="warningList">
        {warnings.map((warning) => (
          <li className={severityClass(warning.severity)} key={warning.code}>
            <span>{warning.message}</span>
            <code>{warning.code}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
