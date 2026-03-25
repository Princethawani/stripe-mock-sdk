import type { PaymentMethod } from "../interface/types";

export class PaymentMethodStore {
  private methods = new Map<string, PaymentMethod>();

  save(pm: PaymentMethod): void {
    this.methods.set(pm.id, pm);
  }

  findById(id: string): PaymentMethod | undefined {
    return this.methods.get(id);
  }

  allForCustomer(customerId: string): PaymentMethod[] {
    return Array.from(this.methods.values()).filter((pm) => pm.customer === customerId);
  }

  reset(): void {
    this.methods.clear();
  }
}