import type { SubscriptionStatus } from "../../paymentIntents/interface/types";

export type { SubscriptionStatus };

export interface Price {
  id: string;
  object: "price";
  currency: string;
  unit_amount: number;
  recurring: {
    interval: "day" | "week" | "month" | "year";
    interval_count: number;
  };
  product: string;
  active: boolean;
}

export interface SubscriptionItem {
  id: string;
  object: "subscription_item";
  price: Price;
  quantity: number;
}

export interface Subscription {
  id: string;
  object: "subscription";
  customer: string;
  status: SubscriptionStatus;
  items: { data: SubscriptionItem[]; object: "list" };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  trial_start: number | null;
  trial_end: number | null;
  default_payment_method: string | null;
  metadata: Record<string, string>;
  latest_invoice: string | null;
  created: number;
  livemode: false;
}

export interface CreateSubscriptionParams {
  customer: string;
  items: Array<{ price: string; quantity?: number }>;
  default_payment_method?: string;
  trial_period_days?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  items?: Array<{ id?: string; price?: string; quantity?: number }>;
  cancel_at_period_end?: boolean;
  default_payment_method?: string;
  metadata?: Record<string, string>;
}