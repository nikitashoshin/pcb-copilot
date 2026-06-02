import type { BomItem } from "@/types/project";

/**
 * Рендерит BoM в табличном виде без изменения данных, полученных от backend.
 * Таблица остаётся черновым перечнем элементов и требует инженерной проверки.
 */
export function BomTable({ bom }: { bom: BomItem[] }) {
  return (
    <section>
      <div className="sectionTitle">
        <h2>BoM / перечень элементов</h2>
        <span>{bom.length}</span>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Поз.</th>
              <th>Наименование</th>
              <th>Тип</th>
              <th>Номинал</th>
              <th>Корпус</th>
              <th>Посадочное место</th>
              <th>Кол-во</th>
              <th>Блок</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((item) => (
              <tr key={`${item.reference}-${item.blockCode}`}>
                <td>{item.reference}</td>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.value || "-"}</td>
                <td>{item.package || "-"}</td>
                <td>{item.footprint || "-"}</td>
                <td>{item.quantity}</td>
                <td>{item.blockCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
