// ─── Shared error types ────────────────────────────────────────────────────────

export interface StripeError {
  type:
    | "card_error"
    | "invalid_request_error"
    | "api_error"
    | "authentication_error"
    | "rate_limit_error"
    | "idempotency_error";
  code?: string;
  message: string;
  param?: string;
  decline_code?: string;
}

// ─── Payment intent types ──────────────────────────────────────────────────────

export type PaymentIntentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "requires_capture"
  | "canceled"
  | "succeeded";

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export interface Charge {
  id: string;
  object: "charge";
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  currency: string;
  customer: string | null;
  payment_intent: string | null;
  payment_method: string | null;
  status: "succeeded" | "pending" | "failed";
  paid: boolean;
  refunded: boolean;
  description: string | null;
  metadata: Record<string, string>;
  created: number;
  livemode: false;
  failure_code: string | null;
  failure_message: string | null;
}

export interface PaymentIntent {
  id: string;
  object: "payment_intent";
  amount: number;
  amount_received: number;
  currency: string;
  status: PaymentIntentStatus;
  client_secret: string;
  customer: string | null;
  payment_method: string | null;
  payment_method_types: string[];
  description: string | null;
  metadata: Record<string, string>;
  capture_method: "automatic" | "manual";
  confirmation_method: "automatic" | "manual";
  charges: { data: Charge[]; object: "list" };
  created: number;
  livemode: false;
  canceled_at: number | null;
  cancellation_reason: string | null;
  last_payment_error: StripeError | null;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customer?: string;
  payment_method?: string;
  payment_method_types?: string[];
  description?: string;
  metadata?: Record<string, string>;
  capture_method?: "automatic" | "manual";
  confirm?: boolean;
}

export interface ConfirmPaymentIntentParams {
  payment_method?: string;
}