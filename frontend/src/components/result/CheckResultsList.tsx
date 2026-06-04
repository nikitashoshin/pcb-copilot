import type { CheckResult } from "@/types/project";
import { severityClass, statusLabel } from "./result-formatting";

const localizedCheckContent: Record<
  string,
  { title: string; message: string; recommendation: string }
> = {
  COMPONENTS_REQUIRE_FOOTPRINTS: {
    title: "Для компонентов должны быть назначены посадочные места",
    message: "Во всех строках перечня элементов заполнено поле «Посадочное место».",
    recommendation: "Назначьте и проверьте посадочные места KiCad перед подготовкой проекта.",
  },
};

function displayContent(check: CheckResult) {
  return (
    localizedCheckContent[check.code] ?? {
      title: check.title,
      message: check.message,
      recommendation: check.recommendation ?? "",
    }
  );
}

/**
 * Отображает подробные результаты первичных проверок архитектуры.
 * Статусы помогают ориентироваться в черновике, но не являются финальным инженерным заключением.
 */
export function CheckResultsList({ checkResults }: { checkResults: CheckResult[] }) {
  return (
    <div className="detailPanel">
      <div className="subsectionHeading">
        <h3>Результаты проверок</h3>
        <span>{checkResults.length}</span>
      </div>
      <div className="checksList">
        {checkResults.map((check) => {
          const content = displayContent(check);

          return (
            <article className={`checkItem ${severityClass(check.severity)}`} key={check.code}>
              <div>
                <div className="checkTitleRow">
                  <h4>{content.title}</h4>
                  <code>{check.code}</code>
                </div>
                <p>{content.message}</p>
                {content.recommendation && <small>{content.recommendation}</small>}
              </div>
              <span>{statusLabel(check)}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
