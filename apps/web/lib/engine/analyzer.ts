import type {
  ActionItem,
  AnalysisResponse,
  ClassifiedMessage,
  DemoSummary,
  SupportMessage,
  TopicStat,
  WeeklyMemo,
} from "./types";

const CATEGORY_RULES: Array<[string, string[]]> = [
  [
    "refund",
    [
      "reembolso",
      "refund",
      "chargeback",
      "estorno",
      "quero meu dinheiro",
      "cancelar assinatura",
      "cancelamento",
    ],
  ],
  [
    "billing",
    [
      "cobrança",
      "cobranca",
      "fatura",
      "invoice",
      "cartão",
      "cartao",
      "pagamento",
      "assinatura",
      "preço",
      "preco",
      "valor cobrado",
    ],
  ],
  [
    "bug",
    [
      "bug",
      "erro",
      "não funciona",
      "nao funciona",
      "quebrado",
      "crash",
      "falha",
      "500",
      "tela branca",
    ],
  ],
  [
    "onboarding",
    [
      "onboarding",
      "como começar",
      "como comecar",
      "primeiro acesso",
      "tutorial",
      "não entendi",
      "nao entendi",
      "configurar",
    ],
  ],
  [
    "delivery",
    [
      "entrega",
      "atraso",
      "tracking",
      "rastreio",
      "pedido não chegou",
      "pedido nao chegou",
      "frete",
      "envio",
    ],
  ],
  [
    "product_clarity",
    [
      "como usar",
      "documentação",
      "documentacao",
      "confuso",
      "não está claro",
      "nao esta claro",
      "explicação",
      "explicacao",
      "feature",
    ],
  ],
  [
    "account_access",
    [
      "login",
      "senha",
      "acesso",
      "2fa",
      "bloqueado",
      "não consigo entrar",
      "nao consigo entrar",
      "reset",
    ],
  ],
];

const NEGATIVE = [
  "péssimo",
  "pessimo",
  "horrível",
  "horrivel",
  "raiva",
  "absurdo",
  "inaceitável",
  "inaceitavel",
  "frustrado",
  "irritado",
  "péssima",
  "pessima",
];

const POSITIVE = [
  "obrigado",
  "obrigada",
  "ótimo",
  "otimo",
  "excelente",
  "resolvido",
  "agradeço",
  "agradeco",
];

const URGENT = [
  "urgente",
  "asap",
  "hoje",
  "agora",
  "imediato",
  "crítico",
  "critico",
  "chargeback",
  "advogado",
];

const ROOT_CAUSES: Record<string, string> = {
  refund: "Política de cancelamento / expectativa de valor não alinhada",
  billing: "Cobrança confusa ou falha de comunicação de preço",
  bug: "Defeito de produto impactando jornada crítica",
  onboarding: "Onboarding incompleto ou fricção no primeiro uso",
  delivery: "Atraso operacional de entrega / logística",
  product_clarity: "Produto ou documentação mal explicados",
  account_access: "Fricção de autenticação / recuperação de conta",
  other: "Sinal misto — revisar manualmente",
};

function norm(text: string): string {
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function classifyCategory(text: string): string {
  const t = norm(text);
  const scores = new Map<string, number>();
  for (const [category, keywords] of CATEGORY_RULES) {
    let score = 0;
    for (const kw of keywords) {
      if (t.includes(kw)) score += 1;
    }
    if (score > 0) scores.set(category, score);
  }
  if (!scores.size) return "other";
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function classifySentiment(text: string): string {
  const t = norm(text);
  const neg = NEGATIVE.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
  const pos = POSITIVE.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
  if (neg > pos) return "negative";
  if (pos > neg) return "positive";
  return "neutral";
}

function classifyUrgency(text: string, category: string): string {
  const t = norm(text);
  if (URGENT.some((w) => t.includes(w)) || category === "refund" || category === "bug") {
    return "high";
  }
  if (["billing", "account_access", "delivery"].includes(category)) return "medium";
  return "low";
}

function refundRiskScore(
  text: string,
  category: string,
  sentiment: string,
  urgency: string
): [number, string[]] {
  let score = 10;
  const drivers: string[] = [];
  const t = norm(text);
  if (category === "refund") {
    score += 45;
    drivers.push("Categoria reembolso/cancelamento");
  }
  if (category === "billing") {
    score += 20;
    drivers.push("Categoria cobrança");
  }
  if (sentiment === "negative") {
    score += 18;
    drivers.push("Sentimento negativo");
  }
  if (urgency === "high") {
    score += 12;
    drivers.push("Urgência alta");
  }
  for (const kw of ["chargeback", "procon", "advogado", "reembolso imediato"]) {
    if (t.includes(kw)) {
      score += 15;
      drivers.push(`Linguagem de risco: ${kw}`);
      break;
    }
  }
  if (t.includes("segunda vez") || t.includes("de novo") || t.includes("novamente")) {
    score += 10;
    drivers.push("Possível contato repetido");
  }
  return [Math.min(100, score), drivers];
}

function parseTs(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

function slaHours(created: string, firstResponse: string | null): number | null {
  const c = parseTs(created);
  const r = parseTs(firstResponse);
  if (!c || !r) return null;
  return Math.round(((r.getTime() - c.getTime()) / 3600000) * 100) / 100;
}

function maskPreview(subject: string, body: string, email: string | null): string {
  let text = `${subject} — ${body}`.replace(/^ — | — $/g, "");
  text = text.replace(/[\w.+-]+@[\w.-]+\.\w+/g, "c***@example.com");
  if (email) text = text.replaceAll(email, "c***@example.com");
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

function maskEmail(email: string | null): string {
  if (!email || !email.includes("@")) return "c***@example.com";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

export function classifyMessage(msg: SupportMessage): ClassifiedMessage {
  const blob = `${msg.subject ?? ""} ${msg.body}`;
  const category = classifyCategory(blob);
  const sentiment = classifySentiment(blob);
  const urgency = classifyUrgency(blob, category);
  const [risk, drivers] = refundRiskScore(blob, category, sentiment, urgency);
  const hours = slaHours(msg.created_at, msg.first_response_at);
  const target = urgency === "high" ? 4 : 24;
  let breach = hours !== null && hours > target;
  let finalDrivers = drivers;
  if (hours === null && msg.status === "open") {
    breach = true;
    finalDrivers = [...drivers, "Sem primeira resposta registrada"];
  }
  return {
    message_id: msg.message_id,
    channel: msg.channel || "email",
    subject: msg.subject ?? "",
    category,
    sentiment,
    urgency,
    refund_risk: risk,
    sla_hours: hours,
    sla_breach: breach,
    root_cause: ROOT_CAUSES[category] ?? ROOT_CAUSES.other,
    masked_preview: maskPreview(msg.subject ?? "", msg.body, msg.customer_email),
    drivers: finalDrivers,
  };
}

function buildActions(
  topics: TopicStat[],
  highRisk: number,
  breachRate: number
): ActionItem[] {
  const actions: ActionItem[] = [];
  if (topics.length) {
    const top = topics[0];
    actions.push({
      priority: "P0",
      title: `Atacar causa raiz: ${top.category}`,
      rationale: `${top.count} mensagens (${(top.share * 100).toFixed(0)}%) com risco médio ${top.avg_refund_risk.toFixed(0)}.`,
      owner_hint: "Produto + Suporte",
    });
  }
  if (highRisk) {
    actions.push({
      priority: "P0",
      title: "Revisar fila de alto risco de reembolso",
      rationale: `${highRisk} mensagens com score ≥ 70 exigem revisão humana.`,
      owner_hint: "Gestor de suporte",
    });
  }
  if (breachRate >= 0.25) {
    actions.push({
      priority: "P1",
      title: "Reduzir breaches de SLA de primeira resposta",
      rationale: `Taxa de breach em ${(breachRate * 100).toFixed(0)}% — revisar cobertura e triagem.`,
      owner_hint: "Operações",
    });
  }
  actions.push({
    priority: "P2",
    title: "Publicar memo semanal para founders",
    rationale: "Transformar sintomas de suporte em backlog de melhoria contínuo.",
    owner_hint: "Founder / CS",
  });
  return actions;
}

export function analyzeMessages(messages: SupportMessage[]): AnalysisResponse {
  const classified = messages.map(classifyMessage);
  const byCat = new Map<string, ClassifiedMessage[]>();
  for (const row of classified) {
    const list = byCat.get(row.category) ?? [];
    list.push(row);
    byCat.set(row.category, list);
  }
  const total = classified.length || 1;
  const topics: TopicStat[] = [...byCat.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([category, rows]) => ({
      category,
      count: rows.length,
      share: Math.round((rows.length / total) * 10000) / 10000,
      avg_refund_risk:
        Math.round((rows.reduce((s, r) => s + r.refund_risk, 0) / rows.length) * 100) /
        100,
      sla_breach_rate:
        Math.round((rows.filter((r) => r.sla_breach).length / rows.length) * 10000) /
        10000,
    }));

  const slaValues = classified
    .map((r) => r.sla_hours)
    .filter((v): v is number => v !== null);
  const openMessages = messages.filter((m) => m.status === "open").length;
  const highRisk = classified.filter((r) => r.refund_risk >= 70).length;
  const breachRate =
    Math.round((classified.filter((r) => r.sla_breach).length / total) * 10000) / 10000;

  const emerging = topics
    .filter((t) => t.share >= 0.12 && t.category !== "other")
    .map((t) => t.category)
    .slice(0, 5);

  return {
    total_messages: classified.length,
    open_messages: openMessages,
    avg_first_response_hours: slaValues.length
      ? Math.round((slaValues.reduce((a, b) => a + b, 0) / slaValues.length) * 100) / 100
      : null,
    sla_breach_rate: breachRate,
    high_refund_risk_count: highRisk,
    topics,
    messages: [...classified].sort(
      (a, b) => b.refund_risk - a.refund_risk || a.message_id.localeCompare(b.message_id)
    ),
    emerging_themes: emerging,
    actions: buildActions(topics, highRisk, breachRate),
    notice:
      "Classificação heurística do lab (regras configuráveis) com revisão humana para risco alto. Camada de inteligência — não substitui helpdesk nem promete IA que resolve suporte sozinha.",
  };
}

export function buildWeeklyMemo(analysis: AnalysisResponse): WeeklyMemo {
  const topCauses = analysis.topics.slice(0, 5).map((t) => ({
    category: t.category,
    count: t.count,
    share_pct: Math.round(t.share * 1000) / 10,
    avg_refund_risk: t.avg_refund_risk,
  }));
  const watch = analysis.messages
    .filter((m) => m.refund_risk >= 70)
    .slice(0, 8)
    .map((m) => ({
      message_id: m.message_id,
      category: m.category,
      refund_risk: m.refund_risk,
      preview: m.masked_preview,
    }));
  const topLabel = topCauses[0]?.category ?? "outros";
  return {
    title: "SupportSignal Weekly Memo",
    period_label: "Demo week (synthetic inbox)",
    executive_summary: `Na janela demo, ${analysis.total_messages} mensagens foram classificadas. Tema dominante: ${topLabel}. Breach de SLA: ${(analysis.sla_breach_rate * 100).toFixed(0)}%. Alto risco de reembolso: ${analysis.high_refund_risk_count} casos.`,
    top_causes: topCauses,
    sla_snapshot: {
      avg_first_response_hours: analysis.avg_first_response_hours,
      sla_breach_rate: analysis.sla_breach_rate,
      open_messages: analysis.open_messages,
    },
    refund_watchlist: watch,
    recommended_actions: analysis.actions,
    caveats: [
      "Classificação do lab é heurística e exige revisão humana em risco alto.",
      "Dataset sintético — não usar como evidência de clientes reais.",
      "Produto é camada de inteligência; não automatiza atendimento completo.",
    ],
  };
}

export function summarizeDemo(messages: SupportMessage[]): DemoSummary {
  const channels = [...new Set(messages.map((m) => m.channel))].sort();
  const opens = messages.filter((m) => m.status === "open").length;
  const dates = messages.map((m) => m.created_at).filter(Boolean).sort();
  return {
    rows: messages.length,
    channels,
    open_rate: messages.length ? opens / messages.length : 0,
    date_span: { from: dates[0] ?? null, to: dates[dates.length - 1] ?? null },
    sample_masked_contacts: messages
      .slice(0, 3)
      .map((m) => maskEmail(m.customer_email)),
    notice:
      "Synthetic anonymized support inbox for portfolio lab demo. Not production customer data.",
  };
}

export async function loadDemoMessages(): Promise<SupportMessage[]> {
  const res = await fetch("/data/support_inbox_demo.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load demo seed (${res.status})`);
  return (await res.json()) as SupportMessage[];
}

export async function runLabDemo(): Promise<{
  demo: DemoSummary;
  analysis: AnalysisResponse;
  memo: WeeklyMemo;
}> {
  const messages = await loadDemoMessages();
  const analysis = analyzeMessages(messages);
  return {
    demo: summarizeDemo(messages),
    analysis,
    memo: buildWeeklyMemo(analysis),
  };
}
