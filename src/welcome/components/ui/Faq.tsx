export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq border-t border-hair">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}<i aria-hidden="true" /></summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
