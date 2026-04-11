import type { PaymentMethod, CreatePaymentMethodParams } from "../interface/types";
import { notFound } from "../../../middlewares/errorHandler";
import type { PaymentMethodStore } from "../infrastructure/PaymentMethodStore";
import type { ScenarioEngine } from "../../../utils/scenarios";
import { generateId } from "../../../shared/idGenerator";
import { now } from "../../../shared/timeHelpers";
import { parseCard } from "../../../shared/cardScenarios";

export class PaymentMethodService {
  constructor(
    private store: PaymentMethodStore,
    private scenarios: ScenarioEngine
  ) {}

  async create(params: CreatePaymentMethodParams): Promise<PaymentMethod> {
    this.scenarios.resolveFromCard(params.card.number);
    const { brand, last4, fingerprint } = parseCard(params.card.number);

    const id = generateId("pm");
    const pm: PaymentMethod = {
      id,
      object: "payment_method",
      type: "card",
      card: {
        brand,
        last4,
        exp_month: params.card.exp_month,
        exp_year: params.card.exp_year,
        country: "MW",
        funding: "credit",
        fingerprint,
        checks: {
          cvc_check: "pass",
          address_line1_check: "unchecked",
          address_postal_code_check: "unchecked",
        },
      },
      customer: null,
      metadata: params.metadata ?? {},
      created: now(),
      livemode: false,
      billing_details: {
        name: params.billing_details?.name ?? null,
        email: params.billing_details?.email ?? null,
        phone: params.billing_details?.phone ?? null,
      },
    };
    this.store.save(pm);
    return pm;
  }

  async retrieve(id: string): Promise<PaymentMethod> {
    const pm = this.store.findById(id);
    if (!pm) notFound("payment_method", id);
    return pm;
  }

  async attach(id: string, params: { customer: string }): Promise<PaymentMethod> {
    const pm = await this.retrieve(id);
    const updated = { ...pm, customer: params.customer };
    this.store.save(updated);
    return updated;
  }

  async detach(id: string): Promise<PaymentMethod> {
    const pm = await this.retrieve(id);
    const updated = { ...pm, customer: null };
    this.store.save(updated);
    return updated;
  }

  async list(params: {
    customer: string;
    type?: "card";
    limit?: number;
    
  }): Promise<{ data: PaymentMethod[]; object: "list"; has_more: boolean }> {
    let data = this.store.allForCustomer(params.customer);
    if (params.type) data = data.filter((pm) => pm.type === params.type);
    const limit = params.limit ?? 10;
    return { data: data.slice(0, limit), object: "list", has_more: data.length > limit };
  }
}