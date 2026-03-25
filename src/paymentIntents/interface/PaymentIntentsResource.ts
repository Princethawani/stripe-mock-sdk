import type { PaymentIntentService } from "../service/PaymentIntentService";
import type {
  PaymentIntent,
  CreatePaymentIntentParams,
  ConfirmPaymentIntentParams,
} from "./types";

/**
 * Public-facing resource — mirrors the Stripe SDK surface.
 * All SDK consumers interact through this class.
 */
export class PaymentIntentsResource {
  constructor(private service: PaymentIntentService) {}

  async create(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    return this.service.create(params);
  }

  async retrieve(id: string): Promise<PaymentIntent> {
    return this.service.retrieve(id);
  }

  async confirm(id: string, params?: ConfirmPaymentIntentParams): Promise<PaymentIntent> {
    return this.service.confirm(id, params);
  }

  async cancel(
    id: string,
    params?: { cancellation_reason?: string }
  ): Promise<PaymentIntent> {
    return this.service.cancel(id, params);
  }
}