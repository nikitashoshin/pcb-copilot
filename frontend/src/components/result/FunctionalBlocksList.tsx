import type { FunctionalBlockResult } from "@/types/project";

/**
 * Отображает выбранные функциональные блоки архитектурного черновика.
 * Технические blockCode остаются английскими, потому что это стабильные ключи backend.
 */
export function FunctionalBlocksList({ blocks }: { blocks: FunctionalBlockResult[] }) {
  return (
    <section>
      <div className="sectionTitle">
        <h2>Функциональные блоки</h2>
        <span>{blocks.length}</span>
      </div>
      <div className="blockGrid">
        {blocks.map((block) => (
          <article className="blockCard" key={block.code}>
            <div className="cardMeta">
              <span>{block.category}</span>
              <strong>x{block.quantity}</strong>
            </div>
            <h3>{block.name}</h3>
            <p>{block.description}</p>
            <code>{block.code}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
