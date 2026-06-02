import type { CheckResult } from "@/types/project";
import { severityClass, statusLabel } from "./result-formatting";

/**
 * Отображает результаты первичных проверок архитектуры.
 * Статусы не являются финальным инженерным заключением и показывают, что нужно проверить вручную.
 */
export function CheckResultsList({ checkResults }: { checkResults: CheckResult[] }) {
  return (
    <section>
      <div className="sectionTitle">
        <h2>Результаты проверок</h2>
        <span>{checkResults.length}</span>
      </div>
      <div className="checksList">
        {checkResults.map((check) => (
          <article className={`checkItem ${severityClass(check.severity)}`} key={check.code}>
            <div>
              <h3>{check.title}</h3>
              <p>{check.message}</p>
              {check.recommendation && <small>{check.recommendation}</small>}
            </div>
            <span>{statusLabel(check)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
