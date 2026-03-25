export interface Refund {
  id: string;
  object: "refund";
  amount: number;
  charge: string;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "canceled";
  reason: "duplicate" | "fraudulent" | "requested_by_customer" | null;
  metadata: Record<string, string>;
  created: number;
}

export interface CreateRefundParams {
  charge: string;
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, string>;
}