import type { CustomerService } from "../service/CustomerService";
import type { Customer, CreateCustomerParams, UpdateCustomerParams } from "./types";

export class CustomersResource {
  constructor(private service: CustomerService) {}

  async create(params?: CreateCustomerParams): Promise<Customer> {
    return this.service.create(params);
  }

  async retrieve(id: string): Promise<Customer> {
    return this.service.retrieve(id);
  }

  async update(id: string, params: UpdateCustomerParams): Promise<Customer> {
    return this.service.update(id, params);
  }

  async del(id: string): Promise<{ id: string; object: "customer"; deleted: true }> {
    return this.service.del(id);
  }

  async list(params?: { limit?: number; email?: string }): Promise<{
    data: Customer[];
    object: "list";
    has_more: boolean;
  }> {
    return this.service.list(params);
  }
}