import { ScenarioEngine } from "./utils/scenarios";

// ── Infrastructure ─────────────────────────────────────────────────────────────
import { CustomerStore } from "./src/customers/infrastructure/CustomerStore";
import { PaymentMethodStore } from "./src/paymentMethods/infrastructure/PaymentMethodStore";
import { PaymentIntentStore } from "./src/paymentIntents/infrastructure/PaymentIntentStore";
import { SubscriptionStore } from "./src/subscriptions/infrastructure/SubscriptionStore";
import { RefundStore } from "./src/refunds/infrastructure/RefundStore";
import { WebhookStore } from "./src/webhooks/infrastructure/WebhookStore";

// ── Services ───────────────────────────────────────────────────────────────────
import { WebhookService } from "./src/webhooks/service/WebhookService";
import { CustomerService } from "./src/customers/service/CustomerService";
import { PaymentMethodService } from "./src/paymentMethods/service/PaymentMethodService";
import { PaymentIntentService } from "./src/paymentIntents/service/PaymentIntentService";
import { SubscriptionService } from "./src/subscriptions/service/SubscriptionService";
import { RefundService } from "./src/refunds/service/RefundService";

// ── Resources (public interface) ───────────────────────────────────────────────
import { CustomersResource } from "./src/customers/interface/CustomersResource";
import { PaymentMethodsResource } from "./src/paymentMethods/interface/PaymentMethodsResource";
import { PaymentIntentsResource } from "./src/paymentIntents/interface/PaymentIntentsResource";
import { SubscriptionsResource } from "./src/subscriptions/interface/SubscriptionsResource";
import { RefundsResource } from "./src/refunds/interface/RefundsResource";
import { WebhookEmitter } from "./src/webhooks/interface/WebhookEmitter";

import type { ScenarioName, ScenarioConfig } from "./utils/scenarios";

export class StripeMock {
  readonly scenario: ScenarioEngine;
  readonly webhooks: WebhookEmitter;

  readonly customers: CustomersResource;
  readonly paymentMethods: PaymentMethodsResource;
  readonly paymentIntents: PaymentIntentsResource;
  readonly subscriptions: SubscriptionsResource;
  readonly refunds: RefundsResource;

  // ── Stores (available for direct inspection in tests) ──────────────────────
  private readonly _customerStore: CustomerStore;
  private readonly _piStore: PaymentIntentStore;
  private readonly _pmStore: PaymentMethodStore;
  private readonly _subStore: SubscriptionStore;
  private readonly _refundStore: RefundStore;
  private readonly _webhookStore: WebhookStore;

  constructor() {
    // Stores
    this._customerStore = new CustomerStore();
    this._piStore = new PaymentIntentStore();
    this._pmStore = new PaymentMethodStore();
    this._subStore = new SubscriptionStore();
    this._refundStore = new RefundStore();
    this._webhookStore = new WebhookStore();

    // Scenario engine
    this.scenario = new ScenarioEngine();

    // Services
    const webhookService = new WebhookService(this._webhookStore);
    const customerService = new CustomerService(this._customerStore);
    const pmService = new PaymentMethodService(this._pmStore, this.scenario);
    const piService = new PaymentIntentService(this._piStore, this.scenario, webhookService);
    const subService = new SubscriptionService(
      this._subStore,
      this._customerStore,
      this.scenario,
      webhookService
    );
    const refundService = new RefundService(this._refundStore, this._piStore, webhookService);

    // Public resources
    this.webhooks = new WebhookEmitter(webhookService);
    this.customers = new CustomersResource(customerService);
    this.paymentMethods = new PaymentMethodsResource(pmService);
    this.paymentIntents = new PaymentIntentsResource(piService);
    this.subscriptions = new SubscriptionsResource(subService);
    this.refunds = new RefundsResource(refundService);
  }

  /** Shorthand: stripe.use('cardDeclined') */
  use(scenario: ScenarioName): this {
    this.scenario.setScenario(scenario);
    return this;
  }

  /** Custom scenario: stripe.useCustom({ paymentIntent: { status: 'requires_capture' } }) */
  useCustom(config: ScenarioConfig): this {
    this.scenario.setCustomScenario(config);
    return this;
  }

  /**
   * Reset everything — stores, scenario, webhook handlers and history.
   * Call in beforeEach / afterEach to isolate tests.
   */
  reset(): this {
    this._customerStore.reset();
    this._piStore.reset();
    this._pmStore.reset();
    this._subStore.reset();
    this._refundStore.reset();
    this._webhookStore.reset();
    this.scenario.reset();
    return this;
  }
}

// ── Re-exports ─────────────────────────────────────────────────────────────────
export { StripeMockError } from "./middlewares/errorHandler";
export type { ScenarioName, ScenarioConfig } from "./utils/scenarios";
export type { Customer, CreateCustomerParams } from "./src/customers/interface/types";
export type {
  PaymentIntent,
  Charge,
  CreatePaymentIntentParams,
  StripeError,
} from "./src/paymentIntents/interface/types";
export type {
  PaymentMethod,
  CreatePaymentMethodParams,
} from "./src/paymentMethods/interface/types";
export type {
  Subscription,
  Price,
  CreateSubscriptionParams,
} from "./src/subscriptions/interface/types";
export type { Refund, CreateRefundParams } from "./src/refunds/interface/types";
export type {
  WebhookEvent,
  WebhookEventType,
} from "./src/webhooks/interface/types";