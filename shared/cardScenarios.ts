import type { ScenarioName } from "../utils/scenarios";

export const CARD_SCENARIO_MAP: Record<string, ScenarioName> = {
  "4242424242424242": "success",
  "4000000000000002": "cardDeclined",
  "4000000000009995": "insufficientFunds",
  "4000000000000069": "expiredCard",
  "4000000000000127": "incorrectCvc",
  "4000002500003155": "requiresAction",
};

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function parseCard(number: string): {
  brand: CardBrand;
  last4: string;
  fingerprint: string;
} {
  const last4 = number.slice(-4);
  let brand: CardBrand = "unknown";
  if (number.startsWith("4")) brand = "visa";
  else if (number.startsWith("5") || number.startsWith("2")) brand = "mastercard";
  else if (number.startsWith("34") || number.startsWith("37")) brand = "amex";
  else if (number.startsWith("6")) brand = "discover";
  return { brand, last4, fingerprint: `fp_${last4}` };
}