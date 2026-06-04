import type { EngineeringReview, EngineeringRiskItem } from "@/types/project";
import { missingParameterDisplay } from "./result-formatting";

const riskGroups = [
  { priority: "Critical", title: "Критично", className: "reviewRiskCritical" },
  { priority: "RequiresDecision", title: "Требует решения", className: "reviewRiskDecision" },
  { priority: "Recommendation", title: "Рекомендации", className: "reviewRiskRecommendation" },
];

function risksByPriority(items: EngineeringRiskItem[], priority: string) {
  return items.filter((item) => item.priority === priority);
}

/**
 * Показывает riskSummary как отдельную вкладку dashboard.
 * Компонент не пересчитывает риски backend, а только группирует их по приоритетам для быстрого чтения.
 */
export function RiskSummaryTab({ review }: { review?: EngineeringReview | null }) {
  if (!review) {
    return null;
  }

  return (
    <section className="dashboardSection">
      <div className="dashboardSectionHeading">
        <div>
          <p className="sectionKicker">Инженерный анализ</p>
          <h2>Риски и приоритеты</h2>
        </div>
        <span>{review.riskSummary.length} рисков</span>
      </div>

      <div className="reviewRiskGrid">
        {riskGroups.map((group) => {
          const items = risksByPriority(review.riskSummary, group.priority);

          return (
            <div className="reviewRiskGroup" key={group.priority}>
              <div className="riskGroupHeading">
                <h3>{group.title}</h3>
                <span>{items.length}</span>
              </div>
              <div className="reviewRiskList">
                {items.map((item) => (
                  <article className={`reviewRiskItem ${group.className}`} key={item.code}>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <small>
                      <b>Рекомендация:</b> {item.recommendation}
                    </small>
                    <div className="technicalCodeLine">
                      <code>{item.code}</code>
                      {item.relatedBlockCode && <code>{item.relatedBlockCode}</code>}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Показывает параметры, которых не хватает для перехода от черновика к инженерной проработке.
 * Карточки заменяют широкую таблицу, чтобы раздел не создавал горизонтальный скролл.
 */
export function MissingParametersTab({ review }: { review?: EngineeringReview | null }) {
  if (!review) {
    return null;
  }

  return (
    <section className="dashboardSection">
      <div className="dashboardSectionHeading">
        <div>
          <p className="sectionKicker">Исходные данные</p>
          <h2>Что нужно уточнить</h2>
          <p className="sectionDescription">
            Эти параметры не обязательно были доступны в текущей форме. Список показывает, какие
            данные потребуются на следующем этапе инженерной детализации.
          </p>
        </div>
        <span>{review.missingParameters.length} параметров</span>
      </div>

      <div className="parameterCardGrid">
        {review.missingParameters.map((item) => {
          const display = missingParameterDisplay(item);

          return (
            <article className="parameterCard" key={item.code}>
              <div className="parameterCardHeader">
                <h3>{display.title}</h3>
                <span className="statusBadge statusBadgeDecision">{display.status}</span>
              </div>
              <p>{display.whyItMatters}</p>
              <small>
                <b>Рекомендация:</b> {display.recommendation}
              </small>
              <code>{item.code}</code>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Даёт компактную сводку по линиям питания и GPIO без широких таблиц.
 * Значения остаются предварительной оценкой и требуют ручного расчёта инженера.
 */
export function ResourcesTab({ review }: { review?: EngineeringReview | null }) {
  if (!review) {
    return null;
  }

  return (
    <section className="dashboardSection">
      <div className="dashboardSectionHeading">
        <div>
          <p className="sectionKicker">Предварительная оценка</p>
          <h2>Питание и ресурсы микроконтроллера</h2>
        </div>
      </div>

      <div className="resourceGrid">
        <div className="resourcePanel">
          <div className="subsectionHeading">
            <h3>Предварительный бюджет питания</h3>
            <span>{review.powerBudget.length}</span>
          </div>
          <div className="resourceCardGrid">
            {review.powerBudget.map((item) => (
              <article className="resourceCard" key={item.rail}>
                <div className="resourceCardHeader">
                  <h4>{item.rail}</h4>
                  <span>{item.status}</span>
                </div>
                <div className="tagList" aria-label={`Потенциальные нагрузки ${item.rail}`}>
                  {item.loads.map((load) => (
                    <span key={load}>{load}</span>
                  ))}
                </div>
                <p>{item.recommendation}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="resourcePanel">
          <div className="subsectionHeading">
            <h3>Ресурсы микроконтроллера</h3>
            <span>{review.gpioBudget.length}</span>
          </div>
          <div className="gpioSummaryList">
            {review.gpioBudget.map((item) => (
              <article className="gpioSummaryItem" key={item.function}>
                <div>
                  <h4>{item.function}</h4>
                  <p>{item.requiredResources.join(", ")}</p>
                  <small>{item.notes}</small>
                </div>
                <strong>{item.estimatedPins}</strong>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
