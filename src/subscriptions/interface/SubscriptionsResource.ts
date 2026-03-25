import type { SubscriptionService } from "../service/SubscriptionService";
import type {
  Subscription,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
} from "./types";

export class SubscriptionsResource {
  constructor(private service: SubscriptionService) {}

  async create(params: CreateSubscriptionParams): Promise<Subscription> {
    return this.service.create(params);
  }

  async retrieve(id: string): Promise<Subscription> {
    return this.service.retrieve(id);
  }

  async update(id: string, params: UpdateSubscriptionParams): Promise<Subscription> {
    return this.service.update(id, params);
  }

  async cancel(id: string): Promise<Subscription> {
    return this.service.cancel(id);
  }

  async list(params?: {
    customer?: string;
    status?: Subscription["status"];
    limit?: number;
  }): Promise<{ data: Subscription[]; object: "list"; has_more: boolean }> {
    return this.service.list(params);
  }
}