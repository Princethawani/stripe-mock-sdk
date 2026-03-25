import type { Customer } from "../interface/types";

export class CustomerStore {
  private customers = new Map<string, Customer>();

  save(customer: Customer): void {
    this.customers.set(customer.id, customer);
  }

  findById(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  all(): Customer[] {
    return Array.from(this.customers.values()).filter((c) => !c.deleted);
  }

  reset(): void {
    this.customers.clear();
  }
}