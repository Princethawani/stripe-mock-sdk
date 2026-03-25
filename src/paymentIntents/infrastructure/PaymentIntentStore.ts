import type { PaymentIntent, Charge } from "../interface/types";

export class PaymentIntentStore {
  private intents = new Map<string, PaymentIntent>();
  private charges = new Map<string, Charge>();

  // ── Payment Intents ────────────────────────────────────────────────────────

  save(intent: PaymentIntent): void {
    this.intents.set(intent.id, intent);
  }

  findById(id: string): PaymentIntent | undefined {
    return this.intents.get(id);
  }

  all(): PaymentIntent[] {
    return Array.from(this.intents.values());
  }

  // ── Charges ────────────────────────────────────────────────────────────────

  saveCharge(charge: Charge): void {
    this.charges.set(charge.id, charge);
  }

  findCharge(id: string): Charge | undefined {
    return this.charges.get(id);
  }

  allCharges(): Charge[] {
    return Array.from(this.charges.values());
  }

  reset(): void {
    this.intents.clear();
    this.charges.clear();
  }
}