import type {
  ArchitectureResult,
  EngineeringDecisionItem,
  EngineeringNextStep,
  EngineeringRiskItem,
  MissingEngineeringParameter,
} from "@/types/project";
import { missingParameterDisplay } from "./result-formatting";

type AttentionItem = {
  key: string;
  kind: "critical" | "clarification" | "decision";
  label: string;
  title: string;
  detail: string;
};

function riskCount(risks: EngineeringRiskItem[], priority: string) {
  return risks.filter((risk) => risk.priority === priority).length;
}

function buildAttentionItems(result: ArchitectureResult): AttentionItem[] {
  const review = result.engineeringReview;
  const criticalRisks = review?.riskSummary.filter((risk) => risk.priority === "Critical") ?? [];
  const missingParameters = review?.missingParameters ?? [];
  const decisions = review?.engineeringDecisions ?? [];

  const highlightedItems: AttentionItem[] = [
    ...criticalRisks.slice(0, 2).map((risk) => fromCriticalRisk(risk)),
    ...missingParameters.slice(0, 2).map((parameter) => fromMissingParameter(parameter)),
    ...decisions.slice(0, 1).map((decision) => fromDecision(decision)),
  ];

  const remainingItems: AttentionItem[] = [
    ...criticalRisks.slice(2).map((risk) => fromCriticalRisk(risk)),
    ...missingParameters.slice(2).map((parameter) => fromMissingParameter(parameter)),
    ...decisions.slice(1).map((decision) => fromDecision(decision)),
  ];

  return [...highlightedItems, ...remainingItems].slice(0, 5);
}

function buildNextSteps(steps: EngineeringNextStep[] | undefined): EngineeringNextStep[] {
  return [...(steps ?? [])].sort((left, right) => left.order - right.order).slice(0, 5);
}

function fromCriticalRisk(risk: EngineeringRiskItem): AttentionItem {
  return {
    key: `risk-${risk.code}`,
    kind: "critical",
    label: "Критичный риск",
    title: risk.title,
    detail: risk.message,
  };
}

function fromMissingParameter(parameter: MissingEngineeringParameter): AttentionItem {
  const display = missingParameterDisplay(parameter);

  return {
    key: `parameter-${parameter.code}`,
    kind: "clarification",
    label: "Нужно уточнить",
    title: display.title,
    detail: display.whyItMatters,
  };
}

function fromDecision(decision: EngineeringDecisionItem): AttentionItem {
  return {
    key: `decision-${decision.code}`,
    kind: "decision",
    label: "Решение инженера",
    title: decision.title,
    detail: decision.whyItMatters,
  };
}

/**
 * Формирует верхнюю сводку результата, чтобы инженер сразу видел масштаб проекта
 * и главные вопросы, требующие внимания до перехода к техническим деталям.
 */
export function ResultDashboardSummary({ result }: { result: ArchitectureResult }) {
  const review = result.engineeringReview;
  const risks = review?.riskSummary ?? [];
  const totalBomQuantity = result.bom.reduce((total, item) => total + item.quantity, 0);
  const attentionItems = buildAttentionItems(result);
  const nextSteps = buildNextSteps(review?.nextSteps);

  const metrics = [
    { label: "Функциональных узлов", value: result.functionalBlocks.length },
    { label: "Элементов по перечню", value: totalBomQuantity },
    { label: "Инженерных предупреждений", value: result.warnings.length },
    { label: "Результатов проверок", value: result.checkResults.length },
    { label: "Нужно уточнить", value: review?.missingParameters.length ?? 0 },
    { label: "Критичных рисков", value: riskCount(risks, "Critical"), tone: "critical" },
    { label: "Решений инженера", value: review?.engineeringDecisions.length ?? 0, tone: "decision" },
    { label: "Рекомендаций", value: riskCount(risks, "Recommendation"), tone: "recommendation" },
  ];

  return (
    <div className="overviewDashboard">
      <div className="summaryMetrics" aria-label="Сводные показатели проекта">
        {metrics.map((metric) => (
          <div className={`summaryMetric ${metric.tone ? `summaryMetric${metric.tone}` : ""}`} key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="attentionPanel">
        <div className="attentionHeading">
          <div>
            <h2>Что требует внимания</h2>
            <p>Главные вопросы, которые стоит проверить до детализации схемы.</p>
          </div>
          <span>{attentionItems.length}</span>
        </div>

        {attentionItems.length > 0 ? (
          <ul className="attentionList">
            {attentionItems.map((item) => (
              <li className={`attentionItem attentionItem${item.kind}`} key={item.key}>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mutedText">Главные замечания не сформированы.</p>
        )}
      </div>

      <div className="nextActionsPanel">
        <div className="attentionHeading">
          <div>
            <h2>Следующие действия</h2>
            <p>Ближайшие шаги перед детализацией схемы и выбором компонентов.</p>
          </div>
          <span>{nextSteps.length}</span>
        </div>

        {nextSteps.length > 0 ? (
          <ol className="reviewNextSteps overviewNextSteps">
            {nextSteps.map((item) => (
              <li key={item.order}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mutedText">Следующие инженерные шаги не сформированы.</p>
        )}
      </div>
    </div>
  );
}
