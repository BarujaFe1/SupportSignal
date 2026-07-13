"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Kpi,
  LabBanner,
  LoadingSkeleton,
  Panel,
  SectionNav,
  TopBar,
} from "@/components/LabChrome";
import { RefundRiskTable } from "@/components/RefundRiskTable";
import { TopicChart } from "@/components/TopicChart";
import { runLabDemo } from "@/lib/engine/analyzer";
import type { AnalysisResponse, DemoSummary, WeeklyMemo } from "@/lib/engine/types";

export default function HomePage() {
  const [demo, setDemo] = useState<DemoSummary | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [memo, setMemo] = useState<WeeklyMemo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [ranOnce, setRanOnce] = useState(false);

  function runDemo() {
    startTransition(async () => {
      try {
        setError(null);
        const result = await runLabDemo();
        setDemo(result.demo);
        setAnalysis(result.analysis);
        setMemo(result.memo);
        setRanOnce(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to run SupportSignal lab demo"
        );
      }
    });
  }

  useEffect(() => {
    runDemo();
  }, []);

  const topRisk =
    analysis?.messages.filter((m) => m.refund_risk >= 70).slice(0, 6) ?? [];
  const showSkeleton = pending && !analysis;

  return (
    <main>
      <a className="skip-link" href="#cockpit">
        Ir para o cockpit
      </a>
      <LabBanner />
      <TopBar />

      <section className="hero">
        <p className="muted">
          Intelligence layer · classificação · SLA · risco de reembolso · causa raiz
        </p>
        <h1 className="brand">SupportSignal</h1>
        <p className="lede">
          Lab MVP: classifica mensagens sintéticas, mede SLA, aponta risco de reembolso e
          sugere ações de causa raiz. Um clique carrega o seed e gera o cockpit — sem
          overclaim de automação total de atendimento.
        </p>
        <div className="actions">
          <button type="button" onClick={runDemo} disabled={pending} aria-busy={pending}>
            {pending
              ? "Analisando inbox…"
              : ranOnce
                ? "Reexecutar demo one-click"
                : "Carregar demo one-click"}
          </button>
          <span className="badge ok">seed sintético · 240 msgs</span>
          <span className="badge watch">regras configuráveis</span>
        </div>
      </section>

      <SectionNav />

      {error ? (
        <div className="notice" role="alert">
          Falha na demo: {error}
        </div>
      ) : null}

      <div id="cockpit">
        <Panel id="inbox" title="Inbox demo">
          {showSkeleton ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid">
                <Kpi
                  label="Mensagens"
                  value={demo?.rows ?? analysis?.total_messages ?? "—"}
                />
                <Kpi label="Canais" value={demo?.channels.length ?? "—"} />
                <Kpi label="Abertas" value={analysis?.open_messages ?? "—"} />
                <Kpi
                  label="Alto risco"
                  value={analysis?.high_refund_risk_count ?? "—"}
                />
              </div>
              <p className="muted" style={{ marginTop: "0.85rem" }}>
                {demo?.notice ??
                  "Rode a demo one-click para carregar o seed sintético mascarado."}
              </p>
            </>
          )}
        </Panel>

        <Panel id="sla" title="SLA & risco">
          {showSkeleton ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid">
                <Kpi
                  label="1ª resposta (média)"
                  value={
                    analysis?.avg_first_response_hours != null
                      ? `${analysis.avg_first_response_hours}h`
                      : "—"
                  }
                />
                <Kpi
                  label="Breach de SLA"
                  value={
                    analysis
                      ? `${(analysis.sla_breach_rate * 100).toFixed(0)}%`
                      : "—"
                  }
                />
                <Kpi
                  label="Temas emergentes"
                  value={analysis?.emerging_themes.length ?? "—"}
                />
              </div>
              {analysis?.emerging_themes?.length ? (
                <p className="muted" style={{ marginTop: "0.85rem" }}>
                  {analysis.emerging_themes.join(" · ")}
                </p>
              ) : null}
            </>
          )}
        </Panel>

        <Panel id="topics" title="Topic classifier">
          {analysis?.topics?.length ? (
            <TopicChart topics={analysis.topics} />
          ) : showSkeleton ? (
            <LoadingSkeleton />
          ) : (
            <p className="muted">
              Clique em “Carregar demo one-click” para classificar o seed.
            </p>
          )}
        </Panel>

        <Panel id="refund-risk" title="Refund risk board">
          {showSkeleton ? <LoadingSkeleton /> : <RefundRiskTable rows={topRisk} />}
        </Panel>

        <Panel id="root-cause" title="Root-cause explorer">
          {showSkeleton ? (
            <LoadingSkeleton />
          ) : (
            <div className="list">
              {(analysis?.topics ?? []).slice(0, 5).map((t) => {
                const sample = analysis?.messages.find((m) => m.category === t.category);
                return (
                  <article key={t.category}>
                    <h3>
                      {t.category} <span className="badge">{t.count} msgs</span>
                    </h3>
                    <p className="muted">
                      Share {(t.share * 100).toFixed(0)}% · risco médio{" "}
                      {t.avg_refund_risk.toFixed(0)} · breach{" "}
                      {(t.sla_breach_rate * 100).toFixed(0)}%
                    </p>
                    {sample ? (
                      <p className="muted">Causa sugerida: {sample.root_cause}</p>
                    ) : null}
                  </article>
                );
              })}
              {!analysis?.topics?.length ? (
                <p className="muted">Sem temas ainda — rode a demo.</p>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel id="memo" title="Weekly support memo">
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
          ) : showSkeleton ? (
            <LoadingSkeleton />
          ) : (
            <p className="muted">Memo aparece após a análise do seed.</p>
          )}
        </Panel>

        <Panel id="actions" title="Action backlog">
          {showSkeleton ? (
            <LoadingSkeleton />
          ) : (
            <>
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
                {!analysis?.actions?.length ? (
                  <p className="muted">Nenhuma ação ainda — rode a demo.</p>
                ) : null}
              </div>
              <p className="muted" style={{ marginTop: "0.85rem" }}>
                {analysis?.notice}
              </p>
            </>
          )}
        </Panel>
      </div>
    </main>
  );
}
