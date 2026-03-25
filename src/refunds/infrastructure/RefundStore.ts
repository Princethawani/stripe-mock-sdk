import type { Refund } from "../interface/types";

export class RefundStore {
  private refunds = new Map<string, Refund>();

  save(refund: Refund): void {
    this.refunds.set(refund.id, refund);
  }

  findById(id: string): Refund | undefined {
    return this.refunds.get(id);
  }

  allForCharge(chargeId: string): Refund[] {
    return Array.from(this.refunds.values()).filter((r) => r.charge === chargeId);
  }

  all(): Refund[] {
    return Array.from(this.refunds.values());
  }

  reset(): void {
    this.refunds.clear();
  }
}