import type { WebhookService } from "../service/WebhookService";
import type { WebhookEvent, WebhookEventType, WebhookHandler } from "./types";

/**
 * Public-facing webhook emitter — mirrors the Stripe webhooks surface.
 */
export class WebhookEmitter {
  constructor(private service: WebhookService) {}

  on<T = unknown>(
    type: WebhookEventType | WebhookEventType[],
    handler: WebhookHandler<T>
  ): this {
    this.service.on(type, handler);
    return this;
  }

  off(type: WebhookEventType, handler: WebhookHandler): this {
    this.service.off(type, handler);
    return this;
  }

  removeAll(): this {
    this.service.removeAll();
    return this;
  }

  getHistory(): WebhookEvent[] {
    return this.service.getHistory();
  }

  getEventsOfType(type: WebhookEventType): WebhookEvent[] {
    return this.service.getEventsOfType(type);
  }

  clearHistory(): this {
    this.service.clearHistory();
    return this;
  }
  constructEvent<T>(type: WebhookEventType, data: T): WebhookEvent<T> {
    return this.service.constructEvent(type, data);
  }
}