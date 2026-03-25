import type { Customer, CreateCustomerParams, UpdateCustomerParams } from "../interface/types";
import { notFound } from "../../../middlewares/errorHandler";
import type { CustomerStore } from "../infrastructure/CustomerStore";
import { generateId } from "../../../shared/idGenerator";
import { now } from "../../../shared/timeHelpers";
import { logger } from "../../../middlewares/requestLogger";

export class CustomerService {
  constructor(private store: CustomerStore) {}

  async create(params: CreateCustomerParams = {}): Promise<Customer> {
    const id = generateId("cus");
    const customer: Customer = {
      id,
      object: "customer",
      email: params.email ?? null,
      name: params.name ?? null,
      phone: params.phone ?? null,
      description: params.description ?? null,
      metadata: params.metadata ?? {},
      created: now(),
      livemode: false,
      default_source: null,
    };
    this.store.save(customer);
    logger.log("info", "customers", "create", id);
    return customer;
  }

  async retrieve(id: string): Promise<Customer> {
    const c = this.store.findById(id);
    if (!c || c.deleted) notFound("customer", id);
    return c;
  }

  async update(id: string, params: UpdateCustomerParams): Promise<Customer> {
    const customer = await this.retrieve(id);
    const updated: Customer = {
      ...customer,
      email: params.email ?? customer.email,
      name: params.name ?? customer.name,
      phone: params.phone ?? customer.phone,
      description: params.description ?? customer.description,
      metadata: { ...customer.metadata, ...(params.metadata ?? {}) },
    };
    this.store.save(updated);
    return updated;
  }

  async del(id: string): Promise<{ id: string; object: "customer"; deleted: true }> {
    await this.retrieve(id);
    const customer = this.store.findById(id)!;
    this.store.save({ ...customer, deleted: true });
    return { id, object: "customer", deleted: true };
  }

  async list(params: { limit?: number; email?: string } = {}): Promise<{
    data: Customer[];
    object: "list";
    has_more: boolean;
  }> {
    let data = this.store.all();
    if (params.email) data = data.filter((c) => c.email === params.email);
    const limit = params.limit ?? 10;
    return { data: data.slice(0, limit), object: "list", has_more: data.length > limit };
  }
}