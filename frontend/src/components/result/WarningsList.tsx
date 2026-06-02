import type { EngineeringWarning } from "@/types/project";
import { severityClass } from "./result-formatting";

/**
 * Показывает инженерные предупреждения, которые backend сформировал
 * по выбранным блокам и промышленному сценарию применения.
 */
export function WarningsList({ warnings }: { warnings: EngineeringWarning[] }) {
  return (
    <section>
      <div className="sectionTitle">
        <h2>Инженерные предупреждения</h2>
        <span>{warnings.length}</span>
      </div>
      <ul className="warningList">
        {warnings.map((warning) => (
          <li className={severityClass(warning.severity)} key={warning.code}>
            <strong>{warning.code}</strong>
            <span>{warning.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
