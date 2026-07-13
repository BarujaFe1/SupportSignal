import type { ClassifiedMessage } from "@/types";

export function RefundRiskTable({ rows }: { rows: ClassifiedMessage[] }) {
  return (
    <table>
      <caption className="sr-only">
        Mensagens com alto risco de reembolso (score maior ou igual a 70)
      </caption>
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Categoria</th>
          <th scope="col">Risco</th>
          <th scope="col">SLA</th>
          <th scope="col">Preview</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.message_id}>
            <td>{m.message_id}</td>
            <td>{m.category}</td>
            <td>
              <span className="badge risk">{m.refund_risk}</span>
            </td>
            <td>
              <span className={`badge ${m.sla_breach ? "watch" : "ok"}`}>
                {m.sla_breach ? "breach" : "ok"}
              </span>
            </td>
            <td className="muted">{m.masked_preview}</td>
          </tr>
        ))}
        {!rows.length ? (
          <tr>
            <td colSpan={5} className="muted">
              Nenhum caso de alto risco ainda — rode a demo.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
