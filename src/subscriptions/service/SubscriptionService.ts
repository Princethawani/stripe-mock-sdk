import type {
  Subscription,
  SubscriptionItem,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
} from "../interface/types";
import { notFound, invalidParam } from "../../../middlewares/errorHandler";
import type { SubscriptionStore } from "../infrastructure/SubscriptionStore";
import type { CustomerStore } from "../../customers/infrastructure/CustomerStore";
import type { ScenarioEngine } from "../../../utils/scenarios";
import type { WebhookService } from "../../webhooks/service/WebhookService";
import { generateId } from "../../../shared/idGenerator";
import { now, addDays, addMonths } from "../../../shared/timeHelpers";

export class SubscriptionService {
  constructor(
    private store: SubscriptionStore,
    private customerStore: CustomerStore,
    private scenarios: ScenarioEngine,
    private webhooks: WebhookService
  ) {}

  async create(params: CreateSubscriptionParams): Promise<Subscription> {
    const customer = this.customerStore.findById(params.customer);
    if (!customer || customer.deleted) notFound("customer", params.customer, "customer");

    const items: SubscriptionItem[] = params.items.map((item) => {
      const price = this.store.findPrice(item.price);
      if (!price) notFound("price", item.price, "price");
      return {
        id: generateId("si"),
        object: "subscription_item" as const,
        price,
        quantity: item.quantity ?? 1,
      };
    });

    const createdAt = now();
    const trialEnd = params.trial_period_days
      ? addDays(createdAt, params.trial_period_days)
      : null;

    const id = generateId("sub");
    const subscription: Subscription = {
      id,
      object: "subscription",
      customer: params.customer,
      status: this.scenarios.subscriptionStatus(),
      items: { data: items, object: "list" },
      current_period_start: createdAt,
      current_period_end: addMonths(createdAt, 1),
      cancel_at_period_end: false,
      canceled_at: null,
      trial_start: trialEnd ? createdAt : null,
      trial_end: trialEnd,
      default_payment_method: params.default_payment_method ?? null,
      metadata: params.metadata ?? {},
      latest_invoice: null,
      created: createdAt,
      livemode: false,
    };

    this.store.save(subscription);
    this.webhooks.emit("customer.subscription.created", subscription);
    return subscription;
  }

  async retrieve(id: string): Promise<Subscription> {
    const sub = this.store.findById(id);
    if (!sub) notFound("subscription", id);
    return sub;
  }

  async update(id: string, params: UpdateSubscriptionParams): Promise<Subscription> {
    const sub = await this.retrieve(id);

    let items = sub.items.data;
    if (params.items) {
      items = params.items.map((item) => {
        if (item.id) {
          const existing = sub.items.data.find((i) => i.id === item.id);
          if (!existing) invalidParam(`No such subscription item: '${item.id}'`);
          return { ...existing, quantity: item.quantity ?? existing.quantity };
        }
        const price = this.store.findPrice(item.price!);
        if (!price) notFound("price", item.price!, "price");
        return {
          id: generateId("si"),
          object: "subscription_item" as const,
          price,
          quantity: item.quantity ?? 1,
        };
      });
    }

    const updated: Subscription = {
      ...sub,
      items: { data: items, object: "list" },
      cancel_at_period_end: params.cancel_at_period_end ?? sub.cancel_at_period_end,
      default_payment_method: params.default_payment_method ?? sub.default_payment_method,
      metadata: { ...sub.metadata, ...(params.metadata ?? {}) },
    };

    this.store.save(updated);
    this.webhooks.emit("customer.subscription.updated", updated);
    return updated;
  }

  async cancel(id: string): Promise<Subscription> {
    const sub = await this.retrieve(id);
    const canceled: Subscription = {
      ...sub,
      status: "canceled",
      canceled_at: now(),
    };
    this.store.save(canceled);
    this.webhooks.emit("customer.subscription.deleted", canceled);
    return canceled;
  }

  async list(
    params: { customer?: string; status?: Subscription["status"]; limit?: number } = {}
  ): Promise<{ data: Subscription[]; object: "list"; has_more: boolean }> {
    let data = this.store.all();
    if (params.customer) data = data.filter((s) => s.customer === params.customer);
    if (params.status) data = data.filter((s) => s.status === params.status);
    const limit = params.limit ?? 10;
    return { data: data.slice(0, limit), object: "list", has_more: data.length > limit };
  }
}