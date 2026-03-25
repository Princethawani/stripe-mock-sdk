import type { Subscription, Price } from "../interface/types";
import { config } from "../../../config";

export class SubscriptionStore {
  private subscriptions = new Map<string, Subscription>();
  private prices = new Map<string, Price>();

  constructor() {
    this.seedPrices();
  }

  // ── Subscriptions ──────────────────────────────────────────────────────────

  save(subscription: Subscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  findById(id: string): Subscription | undefined {
    return this.subscriptions.get(id);
  }

  all(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  // ── Prices ─────────────────────────────────────────────────────────────────

  findPrice(id: string): Price | undefined {
    return this.prices.get(id);
  }

  savePrice(price: Price): void {
    this.prices.set(price.id, price);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  reset(): void {
    this.subscriptions.clear();
    this.prices.clear();
    this.seedPrices();
  }

  private seedPrices(): void {
    for (const p of config.defaultPrices) {
      this.prices.set(p.id, {
        id: p.id,
        object: "price",
        currency: p.currency,
        unit_amount: p.unit_amount,
        recurring: { interval: p.interval, interval_count: p.interval_count },
        product: p.product,
        active: true,
      });
    }
  }
}