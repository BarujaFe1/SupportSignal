export type DemoSummary = {
  rows: number;
  channels: string[];
  open_rate: number;
  date_span: { from: string | null; to: string | null };
  sample_masked_contacts: string[];
  notice: string;
};

export type TopicStat = {
  category: string;
  count: number;
  share: number;
  avg_refund_risk: number;
  sla_breach_rate: number;
};

export type ClassifiedMessage = {
  message_id: string;
  channel: string;
  subject: string;
  category: string;
  sentiment: string;
  urgency: string;
  refund_risk: number;
  sla_hours: number | null;
  sla_breach: boolean;
  root_cause: string;
  masked_preview: string;
  drivers: string[];
};

export type ActionItem = {
  priority: string;
  title: string;
  rationale: string;
  owner_hint: string;
};

export type AnalysisResponse = {
  total_messages: number;
  open_messages: number;
  avg_first_response_hours: number | null;
  sla_breach_rate: number;
  high_refund_risk_count: number;
  topics: TopicStat[];
  messages: ClassifiedMessage[];
  emerging_themes: string[];
  actions: ActionItem[];
  notice: string;
};

export type WeeklyMemo = {
  title: string;
  period_label: string;
  executive_summary: string;
  top_causes: Array<{
    category: string;
    count: number;
    share_pct: number;
    avg_refund_risk: number;
  }>;
  sla_snapshot: {
    avg_first_response_hours: number | null;
    sla_breach_rate: number;
    open_messages: number;
  };
  refund_watchlist: Array<{
    message_id: string;
    category: string;
    refund_risk: number;
    preview: string;
  }>;
  recommended_actions: ActionItem[];
  caveats: string[];
};
