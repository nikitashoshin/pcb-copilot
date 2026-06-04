"use client";

import { useState } from "react";
import type { BomItem } from "@/types/project";

const INITIAL_ROWS = 10;

/**
 * Рендерит черновой перечень элементов в компактной таблице.
 * По умолчанию показаны первые строки, чтобы таблица не подавляла остальные выводы dashboard.
 */
export function BomTable({ bom }: { bom: BomItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleBom = showAll ? bom : bom.slice(0, INITIAL_ROWS);
  const canToggle = bom.length > INITIAL_ROWS;

  return (
    <section className="dashboardSection" id="bom">
      <div className="dashboardSectionHeading">
        <div>
          <p className="sectionKicker">Комплектующие</p>
          <h2>Перечень элементов (BoM) / {bom.length} позиций</h2>
        </div>
      </div>

      <div className="tableWrap bomTableWrap">
        <table className="bomTable">
          <thead>
            <tr>
              <th>Поз.</th>
              <th>Наименование</th>
              <th>Тип</th>
              <th>Номинал</th>
              <th>Корпус</th>
              <th>Посадочное место</th>
              <th>Кол-во</th>
              <th>Узел / блок</th>
            </tr>
          </thead>
          <tbody>
            {visibleBom.map((item) => (
              <tr key={`${item.reference}-${item.blockCode}`}>
                <td>{item.reference}</td>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.value || "-"}</td>
                <td>{item.package || "-"}</td>
                <td className="truncateCell" title={item.footprint || "-"}>
                  <span>{item.footprint || "-"}</span>
                </td>
                <td>{item.quantity}</td>
                <td className="truncateCell" title={item.blockCode}>
                  <code className="tableCode">{item.blockCode}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canToggle && (
        <div className="tableFooter">
          <span>
            Показано {visibleBom.length} из {bom.length} позиций
          </span>
          <button
            aria-expanded={showAll}
            className="secondaryButton compactButton"
            onClick={() => setShowAll((current) => !current)}
            type="button"
          >
            {showAll ? "Показать первые 10" : "Показать все"}
          </button>
        </div>
      )}
    </section>
  );
}
