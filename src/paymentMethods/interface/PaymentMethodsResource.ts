import type { PaymentMethodService } from "../service/PaymentMethodService";
import type { PaymentMethod, CreatePaymentMethodParams } from "./types";

export class PaymentMethodsResource {
  constructor(private service: PaymentMethodService) {}

  async create(params: CreatePaymentMethodParams): Promise<PaymentMethod> {
    return this.service.create(params);
  }

  async retrieve(id: string): Promise<PaymentMethod> {
    return this.service.retrieve(id);
  }

  async attach(id: string, params: { customer: string }): Promise<PaymentMethod> {
    return this.service.attach(id, params);
  }

  async detach(id: string): Promise<PaymentMethod> {
    return this.service.detach(id);
  }

  async list(params: {
    customer: string;
    type?: "card";
    limit?: number;
  }): Promise<{ data: PaymentMethod[]; object: "list"; has_more: boolean }> {
    return this.service.list(params);
  }
}