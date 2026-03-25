export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export interface PaymentMethod {
  id: string;
  object: "payment_method";
  type: "card";
  card: {
    brand: CardBrand;
    last4: string;
    exp_month: number;
    exp_year: number;
    country: string;
    funding: "credit" | "debit" | "prepaid" | "unknown";
    fingerprint: string;
    checks: {
      cvc_check: "pass" | "fail" | "unavailable" | "unchecked";
      address_line1_check: "pass" | "fail" | "unavailable" | "unchecked";
      address_postal_code_check: "pass" | "fail" | "unavailable" | "unchecked";
    };
  };
  customer: string | null;
  metadata: Record<string, string>;
  created: number;
  livemode: false;
  billing_details: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export interface CreatePaymentMethodParams {
  type: "card";
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, string>;
}