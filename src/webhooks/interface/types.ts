export type WebhookEventType =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.created"
  | "payment_intent.canceled"
  | "customer.created"
  | "customer.updated"
  | "customer.deleted"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.created"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "charge.succeeded"
  | "charge.failed"
  | "charge.refunded";

export interface WebhookEvent<T = unknown> {
  id: string;
  object: "event";
  type: WebhookEventType;
  data: { object: T };
  created: number;
  livemode: false;
  api_version: string;
}

export type WebhookHandler<T = unknown> = (event: WebhookEvent<T>) => void | Promise<void>;