export type AskType =
  | "REPLY"
  | "DOCUMENT"
  | "PAYMENT"
  | "DECISION"
  | "DELIVERY"
  | "OTHER";

export type CounterpartyType = "PERSON" | "COMPANY" | "INSTITUTION";

export type Status = "WAITING" | "DUE_SOON" | "OVERDUE" | "RESOLVED";

export const DEFAULT_LATENCY: Record<AskType, number> = {
  REPLY: 3,
  DOCUMENT: 7,
  PAYMENT: 10,
  DECISION: 15,
  DELIVERY: 5,
  OTHER: 7,
};

export const ASK_TYPE_LABELS: Record<AskType, string> = {
  REPLY: "Reply",
  DOCUMENT: "Document",
  PAYMENT: "Payment",
  DECISION: "Decision",
  DELIVERY: "Delivery",
  OTHER: "Other",
};

export const COUNTERPARTY_TYPE_LABELS: Record<CounterpartyType, string> = {
  PERSON: "Person",
  COMPANY: "Company",
  INSTITUTION: "Institution",
};

export const STATUS_LABELS: Record<Status, string> = {
  WAITING: "Waiting",
  DUE_SOON: "Due Soon",
  OVERDUE: "Overdue",
  RESOLVED: "Resolved",
};

export const ASK_TYPE_COLORS: Record<AskType, string> = {
  REPLY: "badge-reply",
  DOCUMENT: "badge-document",
  PAYMENT: "badge-payment",
  DECISION: "badge-decision",
  DELIVERY: "badge-delivery",
  OTHER: "badge-other",
};

export const COUNTERPARTY_ICONS: Record<CounterpartyType, string> = {
  PERSON: "👤",
  COMPANY: "🏢",
  INSTITUTION: "🏛️",
};
