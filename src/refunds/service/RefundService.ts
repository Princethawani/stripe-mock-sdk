import type { Refund, CreateRefundParams } from "../interface/types";
import { notFound, invalidParam } from "../../../middlewares/errorHandler";
import type { RefundStore } from "../infrastructure/RefundStore";
import type { PaymentIntentStore } from "../../paymentIntents/infrastructure/PaymentIntentStore";
import type { WebhookService } from "../../webhooks/service/WebhookService";
import { generateId } from "../../../shared/idGenerator";
import { now } from "../../../shared/timeHelpers";

export class RefundService {
  constructor(
    private store: RefundStore,
    private piStore: PaymentIntentStore,
    private webhooks: WebhookService
  ) {}

  async create(params: CreateRefundParams): Promise<Refund> {
    const charge = this.piStore.findCharge(params.charge);
    if (!charge) notFound("charge", params.charge, "charge");

    const refundAmount = params.amount ?? charge.amount;

    if (charge.amount_refunded + refundAmount > charge.amount) {
      invalidParam(
        "Refund amount exceeds the charge amount.",
        "amount",
        "amount_too_large"
      );
    }

    const id = generateId("re");
    const refund: Refund = {
      id,
      object: "refund",
      amount: refundAmount,
      charge: params.charge,
      currency: charge.currency,
      status: "succeeded",
      reason: params.reason ?? null,
      metadata: params.metadata ?? {},
      created: now(),
    };

    this.store.save(refund);

    // Update charge totals
    const updatedCharge = {
      ...charge,
      amount_refunded: charge.amount_refunded + refundAmount,
      refunded: charge.amount_refunded + refundAmount >= charge.amount,
    };
    this.piStore.saveCharge(updatedCharge);
    this.webhooks.emit("charge.refunded", updatedCharge);

    return refund;
  }

  async retrieve(id: string): Promise<Refund> {
    const refund = this.store.findById(id);
    if (!refund) notFound("refund", id);
    return refund;
  }

  async list(params: { charge?: string; limit?: number } = {}): Promise<{
    data: Refund[];
    object: "list";
    has_more: boolean;
  }> {
    const data = params.charge
      ? this.store.allForCharge(params.charge)
      : this.store.all();
    const limit = params.limit ?? 10;
    return { data: data.slice(0, limit), object: "list", has_more: data.length > limit };
  }
}