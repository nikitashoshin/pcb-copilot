import Link from "next/link";

export default function HomePage() {
  return (
    <section className="pageShell homeGrid">
      <div className="heroText">
        <p className="eyebrow">MVP для первого сценария</p>
        <h1>PCB Copilot</h1>
        <p className="lead">
          Сервис помогает сформировать черновик архитектуры платы, предварительный BoM и
          инженерные предупреждения для промышленного контроллера на STM32.
        </p>
        <div className="notice">
          Результат является инженерным черновиком и требует ручной проверки
          инженером-электронщиком.
        </div>
        <Link className="primaryButton" href="/new-project">
          Создать проект
        </Link>
      </div>

      <div className="summaryPanel" aria-label="Первый сценарий MVP">
        <h2>Первый сценарий</h2>
        <dl>
          <div>
            <dt>Питание</dt>
            <dd>24V DC, 5V, 3.3V</dd>
          </div>
          <div>
            <dt>MCU</dt>
            <dd>STM32 + SWD</dd>
          </div>
          <div>
            <dt>Интерфейс</dt>
            <dd>RS-485</dd>
          </div>
          <div>
            <dt>Ввод-вывод</dt>
            <dd>4 входа 24V, 2 реле</dd>
          </div>
          <div>
            <dt>Плата</dt>
            <dd>80 x 60 мм, 2 слоя</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
