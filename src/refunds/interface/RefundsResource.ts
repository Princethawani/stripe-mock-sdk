import type { RefundService } from "../service/RefundService";
import type { Refund, CreateRefundParams } from "./types";

export class RefundsResource {
  constructor(private service: RefundService) {}

  async create(params: CreateRefundParams): Promise<Refund> {
    return this.service.create(params);
  }

  async retrieve(id: string): Promise<Refund> {
    return this.service.retrieve(id);
  }

  async list(params?: { charge?: string; limit?: number }): Promise<{
    data: Refund[];
    object: "list";
    has_more: boolean;
  }> {
    return this.service.list(params);
  }
}