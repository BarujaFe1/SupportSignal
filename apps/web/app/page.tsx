"use client";

import { useEffect, useState, useTransition } from "react";
import { TopicChart } from "@/components/TopicChart";
import { fetchDemo, fetchWeeklyMemo, runAnalyze } from "@/lib/api";
import type { AnalysisResponse, DemoSummary, WeeklyMemo } from "@/types";

export default function HomePage() {
  const [demo, setDemo] = useState<DemoSummary | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [memo, setMemo] = useState<WeeklyMemo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const [d, a, m] = await Promise.all([
          fetchDemo(),
          runAnalyze(),
          fetchWeeklyMemo(),
        ]);
        setDemo(d);
        setAnalysis(a);
        setMemo(m);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load SupportSignal API"
        );
      }
    });
  }, []);

  function refresh() {
    startTransition(async () => {
      try {
        setError(null);
        const [a, m] = await Promise.all([runAnalyze(), fetchWeeklyMemo()]);
        setAnalysis(a);
        setMemo(m);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analyze failed");
      }
    });
  }

  const topRisk = analysis?.messages.filter((m) => m.refund_risk >= 70).slice(0, 6) ?? [];

  return (
    <main>
      <section className="hero">
        <p className="muted">
          Intelligence layer · classificação · SLA · risco de reembolso · causa raiz
        </p>
        <h1 className="brand">SupportSignal</h1>
        <p className="lede">
          Transforma suporte em inteligência operacional: classifica mensagens,
          mede SLA, aponta risco de reembolso, explora causa raiz e gera um plano
          de melhoria — sem substituir o helpdesk existente.
        </p>
        <div className="actions">
          <button type="button" onClick={refresh} disabled={pending}>
            {pending ? "Analisando…" : "Reanalisar demo"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="notice">
          API indisponível ({error}). Suba o backend em <code>apps/api</code> na
          porta 8000.
        </div>
      ) : null}

      <section className="panel">
        <h2>Inbox demo</h2>
        <div className="grid">
          <div className="kpi">
            <span>Mensagens</span>
            <strong>{demo?.rows ?? analysis?.total_messages ?? "—"}</strong>
          </div>
          <div className="kpi">
            <span>Canais</span>
            <strong>{demo?.channels.length ?? "—"}</strong>
          </div>
          <div className="kpi">
            <span>Abertas</span>
            <strong>{analysis?.open_messages ?? "—"}</strong>
          </div>
          <div className="kpi">
            <span>Alto risco</span>
            <strong>{analysis?.high_refund_risk_count ?? "—"}</strong>
          </div>
        </div>
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          {demo?.notice}
        </p>
      </section>

      <section className="panel">
        <h2>SLA & risco</h2>
        <div className="grid">
          <div className="kpi">
            <span>1ª resposta (média)</span>
            <strong>
              {analysis?.avg_first_response_hours != null
                ? `${analysis.avg_first_response_hours}h`
                : "—"}
            </strong>
          </div>
          <div className="kpi">
            <span>Breach de SLA</span>
            <strong>
              {analysis
                ? `${(analysis.sla_breach_rate * 100).toFixed(0)}%`
                : "—"}
            </strong>
          </div>
          <div className="kpi">
            <span>Temas emergentes</span>
            <strong>{analysis?.emerging_themes.length ?? "—"}</strong>
          </div>
        </div>
        {analysis?.emerging_themes?.length ? (
          <p className="muted" style={{ marginTop: "0.85rem" }}>
            {analysis.emerging_themes.join(" · ")}
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Topic classifier</h2>
        {analysis?.topics?.length ? (
          <TopicChart topics={analysis.topics} />
        ) : (
          <p className="muted">Aguardando análise…</p>
        )}
      </section>

      <section className="panel">
        <h2>Refund risk board</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Categoria</th>
              <th>Risco</th>
              <th>SLA</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {topRisk.map((m) => (
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
            {!topRisk.length ? (
              <tr>
                <td colSpan={5} className="muted">
                  Nenhum caso de alto risco no momento.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Root-cause explorer</h2>
        <div className="list">
          {(analysis?.topics ?? []).slice(0, 5).map((t) => (
            <article key={t.category}>
              <h3>
                {t.category}{" "}
                <span className="badge">{t.count} msgs</span>
              </h3>
              <p className="muted">
                Share {(t.share * 100).toFixed(0)}% · risco médio{" "}
                {t.avg_refund_risk.toFixed(0)} · breach{" "}
                {(t.sla_breach_rate * 100).toFixed(0)}%
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Weekly support memo</h2>
        {memo ? (
          <>
            <p className="muted">{memo.period_label}</p>
            <p>{memo.executive_summary}</p>
            <div className="list" style={{ marginTop: "1rem" }}>
              {memo.recommended_actions.map((a) => (
                <article key={a.title}>
                  <h3>
                    <span className="badge watch">{a.priority}</span> {a.title}
                  </h3>
                  <p className="muted">
                    {a.rationale} · Owner: {a.owner_hint}
                  </p>
                </article>
              ))}
            </div>
            <p className="muted" style={{ marginTop: "1rem" }}>
              {memo.caveats.join(" ")}
            </p>
          </>
        ) : (
          <p className="muted">Carregando memo…</p>
        )}
      </section>

      <section className="panel">
        <h2>Action backlog</h2>
        <div className="list">
          {(analysis?.actions ?? []).map((a) => (
            <article key={`${a.priority}-${a.title}`}>
              <h3>
                <span className="badge">{a.priority}</span> {a.title}
              </h3>
              <p className="muted">
                {a.rationale} · {a.owner_hint}
              </p>
            </article>
          ))}
        </div>
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          {analysis?.notice}
        </p>
      </section>
    </main>
  );
}
