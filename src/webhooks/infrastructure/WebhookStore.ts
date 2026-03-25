import type { WebhookEvent, WebhookEventType, WebhookHandler } from "../interface/types";

export class WebhookStore {
  private handlers = new Map<string, WebhookHandler[]>();
  private history: WebhookEvent[] = [];

  addHandler(type: WebhookEventType, handler: WebhookHandler): void {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...existing, handler]);
  }

  removeHandler(type: WebhookEventType, handler: WebhookHandler): void {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, existing.filter((h) => h !== handler));
  }

  getHandlers(type: WebhookEventType): WebhookHandler[] {
    return this.handlers.get(type) ?? [];
  }

  pushEvent(event: WebhookEvent): void {
    this.history.push(event);
  }

  getHistory(): WebhookEvent[] {
    return [...this.history];
  }

  getByType(type: WebhookEventType): WebhookEvent[] {
    return this.history.filter((e) => e.type === type);
  }

  reset(): void {
    this.handlers.clear();
    this.history = [];
  }
}