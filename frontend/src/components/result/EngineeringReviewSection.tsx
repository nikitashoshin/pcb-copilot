import type { EngineeringReview, EngineeringRiskItem } from "@/types/project";

const riskGroups = [
  { priority: "Critical", title: "Критично" },
  { priority: "RequiresDecision", title: "Требует решения" },
  { priority: "Recommendation", title: "Рекомендации" },
];

function riskClass(priority: string) {
  if (priority === "Critical") {
    return "reviewRiskCritical";
  }

  if (priority === "RequiresDecision") {
    return "reviewRiskDecision";
  }

  return "reviewRiskRecommendation";
}

function risksByPriority(items: EngineeringRiskItem[], priority: string) {
  return items.filter((item) => item.priority === priority);
}

/**
 * Показывает структурированный предварительный инженерный анализ ArchitectureResult.
 * Компонент не выполняет расчёты на клиенте и отображает данные, сформированные backend.
 */
export function EngineeringReviewSection({ review }: { review?: EngineeringReview | null }) {
  if (!review) {
    return null;
  }

  return (
    <section className="engineeringReviewSection">
      <div className="sectionTitle">
        <h2>Инженерный анализ</h2>
        <span>Review</span>
      </div>

      <p className="reviewNotice">
        Предварительный анализ помогает выявить недостающие параметры, риски и решения.
        Он не является финальным инженерным заключением и требует ручной проверки.
      </p>

      <div className="reviewSubsection">
        <h3>Недостающие параметры</h3>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Параметр</th>
                <th>Почему важно</th>
                <th>Статус</th>
                <th>Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {review.missingParameters.map((item) => (
                <tr key={item.code}>
                  <td>
                    <strong>{item.title}</strong>
                    <code className="inlineCode">{item.code}</code>
                  </td>
                  <td>{item.whyItMatters}</td>
                  <td>{item.status}</td>
                  <td>{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reviewSubsection">
        <h3>Обоснование выбора блоков</h3>
        <ul className="reviewRationaleList">
          {review.blockRationale.map((item) => (
            <li key={item.blockCode}>
              <div>
                <strong>{item.blockName}</strong>
                <code>{item.blockCode}</code>
              </div>
              <p>{item.reason}</p>
              <small>{item.relatedRequirement}</small>
            </li>
          ))}
        </ul>
      </div>

      <div className="reviewSubsection">
        <h3>Риски и приоритеты</h3>
        <div className="reviewRiskGrid">
          {riskGroups.map((group) => {
            const items = risksByPriority(review.riskSummary, group.priority);

            return (
              <div className="reviewRiskGroup" key={group.priority}>
                <h4>{group.title}</h4>
                <div className="reviewRiskList">
                  {items.map((item) => (
                    <article className={`reviewRiskItem ${riskClass(item.priority)}`} key={item.code}>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>{item.recommendation}</small>
                      {item.relatedBlockCode && <code>{item.relatedBlockCode}</code>}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reviewSubsection">
        <h3>Предварительный бюджет питания</h3>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Линия питания</th>
                <th>Потенциальные нагрузки</th>
                <th>Статус</th>
                <th>Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {review.powerBudget.map((item) => (
                <tr key={item.rail}>
                  <td>
                    <strong>{item.rail}</strong>
                  </td>
                  <td>{item.loads.join(", ")}</td>
                  <td>{item.status}</td>
                  <td>{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reviewSubsection">
        <h3>GPIO / периферия STM32</h3>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Функция</th>
                <th>Требуемые ресурсы</th>
                <th>Оценка выводов</th>
                <th>Примечание</th>
              </tr>
            </thead>
            <tbody>
              {review.gpioBudget.map((item) => (
                <tr key={item.function}>
                  <td>
                    <strong>{item.function}</strong>
                  </td>
                  <td>{item.requiredResources.join(", ")}</td>
                  <td>{item.estimatedPins}</td>
                  <td>{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reviewSubsection">
        <h3>Решения инженера</h3>
        <ul className="reviewDecisionList">
          {review.engineeringDecisions.map((item) => (
            <li key={item.code}>
              <strong>{item.title}</strong>
              <p>{item.whyItMatters}</p>
              <small>{item.recommendation}</small>
            </li>
          ))}
        </ul>
      </div>

      <div className="reviewSubsection">
        <h3>Следующие шаги</h3>
        <ol className="reviewNextSteps">
          {[...review.nextSteps]
            .sort((left, right) => left.order - right.order)
            .map((item) => (
              <li key={item.order}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}
