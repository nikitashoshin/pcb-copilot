export type ResultTabId =
  | "overview"
  | "risks"
  | "clarification"
  | "resources"
  | "blocks"
  | "bom"
  | "checks"
  | "export";

const navigationItems: Array<{ id: ResultTabId; label: string }> = [
  { id: "overview", label: "Обзор" },
  { id: "risks", label: "Риски" },
  { id: "clarification", label: "Что уточнить" },
  { id: "resources", label: "Питание и GPIO" },
  { id: "blocks", label: "Узлы платы" },
  { id: "bom", label: "Перечень элементов" },
  { id: "checks", label: "Проверки" },
  { id: "export", label: "Экспорт" },
];

type ResultPageNavigationProps = {
  activeTab: ResultTabId;
  onTabChange: (tab: ResultTabId) => void;
};

/**
 * Управляет вкладками внутри страницы результата.
 * Это локальное состояние dashboard, поэтому вкладки не создают отдельных маршрутов Next.js.
 */
export function ResultPageNavigation({ activeTab, onTabChange }: ResultPageNavigationProps) {
  return (
    <nav aria-label="Разделы результата проекта" className="resultPageNav">
      <div className="resultTabs" role="tablist">
        {navigationItems.map((item) => (
          <button
            aria-controls={`result-tab-${item.id}`}
            aria-selected={activeTab === item.id}
            className="resultTabButton"
            id={`result-tab-button-${item.id}`}
            key={item.id}
            onClick={() => onTabChange(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
