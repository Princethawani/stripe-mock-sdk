import type { WebhookEvent, WebhookEventType, WebhookHandler } from "../interface/types";
import type { WebhookStore } from "../infrastructure/WebhookStore";
import { generateId } from "../../../shared/idGenerator";
import { now } from "../../../shared/timeHelpers";
import { config } from "../../../config";

export class WebhookService {
  constructor(private store: WebhookStore) {}

  on<T = unknown>(
    type: WebhookEventType | WebhookEventType[],
    handler: WebhookHandler<T>
  ): this {
    const types = Array.isArray(type) ? type : [type];
    for (const t of types) {
      this.store.addHandler(t, handler as WebhookHandler);
    }
    return this;
  }

  off(type: WebhookEventType, handler: WebhookHandler): this {
    this.store.removeHandler(type, handler);
    return this;
  }

  emit<T>(type: WebhookEventType, data: T): WebhookEvent<T> {
    const event: WebhookEvent<T> = {
      id: generateId("evt"),
      object: "event",
      type,
      data: { object: data },
      created: now(),
      livemode: false,
      api_version: config.apiVersion,
    };

    this.store.pushEvent(event as WebhookEvent);

    for (const handler of this.store.getHandlers(type)) {
      handler(event as WebhookEvent);
    }

    return event;
  }

  constructEvent<T>(type: WebhookEventType, data: T): WebhookEvent<T> {
    return {
      id: generateId("evt"),
      object: "event",
      type,
      data: { object: data },
      created: now(),
      livemode: false,
      api_version: config.apiVersion,
    };
  }

  getHistory(): WebhookEvent[] {
    return this.store.getHistory();
  }

  getEventsOfType(type: WebhookEventType): WebhookEvent[] {
    return this.store.getByType(type);
  }

  clearHistory(): this {
    this.store.reset();
    return this;
  }

  removeAll(): this {
    this.store.reset();
    return this;
  }
}