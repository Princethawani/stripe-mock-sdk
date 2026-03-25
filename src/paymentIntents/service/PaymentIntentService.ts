import type {
  PaymentIntent,
  Charge,
  CreatePaymentIntentParams,
  ConfirmPaymentIntentParams,
} from "../interface/types";
import { StripeMockError, notFound, invalidParam } from "../../../middlewares/errorHandler";
import type { PaymentIntentStore } from "../infrastructure/PaymentIntentStore";
import type { ScenarioEngine } from "../../../utils/scenarios";
import type { WebhookService } from "../../webhooks/service/WebhookService";
import { generateId, now } from "../../../shared/idGenerator";
import { now as timestamp } from "../../../shared/timeHelpers";
import { logger } from "../../../middlewares/requestLogger";

export class PaymentIntentService {
  constructor(
    private store: PaymentIntentStore,
    private scenarios: ScenarioEngine,
    private webhooks: WebhookService
  ) {}

  async create(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    if (!params.amount || params.amount <= 0) {
      invalidParam("Amount must be greater than 0.", "amount", "parameter_invalid_integer");
    }

    const id = generateId("pi");
    const pi: PaymentIntent = {
      id,
      object: "payment_intent",
      amount: params.amount,
      amount_received: 0,
      currency: params.currency.toLowerCase(),
      status: "requires_payment_method",
      client_secret: `${id}_secret_${generateId("sk")}`,
      customer: params.customer ?? null,
      payment_method: params.payment_method ?? null,
      payment_method_types: params.payment_method_types ?? ["card"],
      description: params.description ?? null,
      metadata: params.metadata ?? {},
      capture_method: params.capture_method ?? "automatic",
      confirmation_method: "automatic",
      charges: { data: [], object: "list" },
      created: timestamp(),
      livemode: false,
      canceled_at: null,
      cancellation_reason: null,
      last_payment_error: null,
    };

    this.store.save(pi);
    logger.log("info", "paymentIntents", "create", id);
    this.webhooks.emit("payment_intent.created", pi);

    if (params.confirm && params.payment_method) {
      return this.confirm(id, { payment_method: params.payment_method });
    }

    return pi;
  }

  async retrieve(id: string): Promise<PaymentIntent> {
    const pi = this.store.findById(id);
    if (!pi) notFound("payment_intent", id);
    return pi;
  }

  async confirm(id: string, params: ConfirmPaymentIntentParams = {}): Promise<PaymentIntent> {
    const pi = await this.retrieve(id);

    if (pi.status === "succeeded") return pi;

    if (pi.status === "canceled") {
      invalidParam("This PaymentIntent's status is canceled.", undefined, "payment_intent_unexpected_state");
    }

    const pmId = params.payment_method ?? pi.payment_method;
    if (!pmId) {
      invalidParam("You must provide a payment method.", "payment_method", "payment_method_required");
    }

    const failError = this.scenarios.getFailError();
    if (failError) {
      const failed: PaymentIntent = {
        ...pi,
        status: "requires_payment_method",
        last_payment_error: failError,
        payment_method: pmId,
      };
      this.store.save(failed);
      this.webhooks.emit("payment_intent.payment_failed", failed);
      throw new StripeMockError(failError, 402);
    }

    if (this.scenarios.shouldRequireAction()) {
      const actionRequired: PaymentIntent = { ...pi, status: "requires_action", payment_method: pmId };
      this.store.save(actionRequired);
      return actionRequired;
    }

    const charge = this.buildCharge(pi, pmId);
    this.store.saveCharge(charge);

    const succeeded: PaymentIntent = {
      ...pi,
      status: "succeeded",
      amount_received: pi.amount,
      payment_method: pmId,
      charges: { data: [charge], object: "list" },
      last_payment_error: null,
    };
    this.store.save(succeeded);
    this.webhooks.emit("payment_intent.succeeded", succeeded);
    this.webhooks.emit("charge.succeeded", charge);
    logger.log("info", "paymentIntents", "confirm", id);
    return succeeded;
  }

  async cancel(id: string, params: { cancellation_reason?: string } = {}): Promise<PaymentIntent> {
    const pi = await this.retrieve(id);

    if (pi.status === "succeeded") {
      invalidParam("You cannot cancel a PaymentIntent that has already succeeded.", undefined, "payment_intent_unexpected_state");
    }

    const canceled: PaymentIntent = {
      ...pi,
      status: "canceled",
      canceled_at: timestamp(),
      cancellation_reason: params.cancellation_reason ?? "requested_by_customer",
    };
    this.store.save(canceled);
    this.webhooks.emit("payment_intent.canceled", canceled);
    return canceled;
  }

  private buildCharge(pi: PaymentIntent, paymentMethodId: string): Charge {
    return {
      id: generateId("ch"),
      object: "charge",
      amount: pi.amount,
      amount_captured: pi.amount,
      amount_refunded: 0,
      currency: pi.currency,
      customer: pi.customer,
      payment_intent: pi.id,
      payment_method: paymentMethodId,
      status: "succeeded",
      paid: true,
      refunded: false,
      description: pi.description,
      metadata: pi.metadata,
      created: timestamp(),
      livemode: false,
      failure_code: null,
      failure_message: null,
    };
  }
}