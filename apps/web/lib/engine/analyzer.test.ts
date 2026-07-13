import { describe, expect, it } from "vitest";
import {
  analyzeMessages,
  buildWeeklyMemo,
  classifyMessage,
  summarizeDemo,
} from "./analyzer";
import type { SupportMessage } from "./types";

const baseMsg = (overrides: Partial<SupportMessage> = {}): SupportMessage => ({
  message_id: "MSG-T1",
  channel: "email",
  subject: "Pedido de reembolso",
  body: "Quero reembolso imediato. Contato: cliente@exemplo.com. Vou pedir chargeback.",
  created_at: "2026-06-01T10:00:00",
  first_response_at: "2026-06-01T16:00:00",
  resolved_at: null,
  customer_email: "cliente@exemplo.com",
  customer_name: "Cliente Teste",
  status: "open",
  ...overrides,
});

describe("SupportSignal browser engine", () => {
  it("classifies refund language and scores high risk", () => {
    const row = classifyMessage(baseMsg());
    expect(row.category).toBe("refund");
    expect(row.refund_risk).toBeGreaterThanOrEqual(70);
    expect(row.masked_preview).toContain("c***@example.com");
    expect(row.masked_preview).not.toContain("cliente@exemplo.com");
    expect(row.drivers.length).toBeGreaterThan(0);
  });

  it("flags SLA breach for slow first response on high urgency", () => {
    const row = classifyMessage(
      baseMsg({
        first_response_at: "2026-06-02T10:00:00",
      })
    );
    expect(row.sla_hours).toBe(24);
    expect(row.sla_breach).toBe(true);
  });

  it("flags open tickets without first response", () => {
    const row = classifyMessage(
      baseMsg({
        first_response_at: null,
        status: "open",
      })
    );
    expect(row.sla_breach).toBe(true);
    expect(row.drivers.some((d) => d.includes("Sem primeira resposta"))).toBe(true);
  });

  it("aggregates topics, actions and weekly memo", () => {
    const messages = [
      baseMsg({ message_id: "1" }),
      baseMsg({
        message_id: "2",
        subject: "Erro 500",
        body: "O botão salvar não funciona e aparece erro 500",
        first_response_at: "2026-06-01T10:30:00",
        status: "resolved",
      }),
      baseMsg({
        message_id: "3",
        subject: "Obrigado",
        body: "Obrigado, já foi resolvido. Excelente suporte.",
        first_response_at: "2026-06-01T10:20:00",
        status: "resolved",
      }),
    ];
    const analysis = analyzeMessages(messages);
    expect(analysis.total_messages).toBe(3);
    expect(analysis.topics.length).toBeGreaterThan(0);
    expect(analysis.actions.length).toBeGreaterThan(0);
    const memo = buildWeeklyMemo(analysis);
    expect(memo.executive_summary).toContain("3");
    expect(memo.caveats.length).toBeGreaterThan(0);
    const demo = summarizeDemo(messages);
    expect(demo.rows).toBe(3);
    expect(demo.channels).toContain("email");
  });
});
