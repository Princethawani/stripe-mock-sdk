import type { StripeError } from "../src/paymentIntents/interface/types";
import type {
  PaymentIntentStatus,
  SubscriptionStatus,
} from "../src/paymentIntents/interface/types";

export type ScenarioName =
  | "success"
  | "cardDeclined"
  | "insufficientFunds"
  | "expiredCard"
  | "incorrectCvc"
  | "requiresAction"
  | "networkError";

export interface ScenarioConfig {
  paymentIntent?: {
    status?: PaymentIntentStatus;
    failWithError?: StripeError;
    requiresAction?: boolean;
  };
  subscription?: {
    status?: SubscriptionStatus;
  };
}

const NAMED: Record<ScenarioName, ScenarioConfig> = {
  success: { paymentIntent: { status: "succeeded" } },
  cardDeclined: {
    paymentIntent: {
      status: "requires_payment_method",
      failWithError: {
        type: "card_error",
        code: "card_declined",
        decline_code: "generic_decline",
        message: "Your card was declined.",
        param: "payment_method",
      },
    },
  },
  insufficientFunds: {
    paymentIntent: {
      status: "requires_payment_method",
      failWithError: {
        type: "card_error",
        code: "card_declined",
        decline_code: "insufficient_funds",
        message: "Your card has insufficient funds.",
        param: "payment_method",
      },
    },
  },
  expiredCard: {
    paymentIntent: {
      status: "requires_payment_method",
      failWithError: {
        type: "card_error",
        code: "expired_card",
        message: "Your card has expired.",
        param: "payment_method",
      },
    },
  },
  incorrectCvc: {
    paymentIntent: {
      status: "requires_payment_method",
      failWithError: {
        type: "card_error",
        code: "incorrect_cvc",
        message: "Your card's security code is incorrect.",
        param: "payment_method",
      },
    },
  },
  requiresAction: {
    paymentIntent: { status: "requires_action", requiresAction: true },
  },
  networkError: {
    paymentIntent: {
      status: "requires_payment_method",
      failWithError: {
        type: "api_error",
        code: "api_connection_error",
        message: "An error occurred while connecting to the Stripe API.",
      },
    },
  },
};

export class ScenarioEngine {
  private active: ScenarioName = "success";
  private custom: ScenarioConfig | null = null;

  setScenario(name: ScenarioName): this {
    this.active = name;
    this.custom = null;
    return this;
  }

  setCustomScenario(config: ScenarioConfig): this {
    this.custom = config;
    return this;
  }

  reset(): this {
    this.active = "success";
    this.custom = null;
    return this;
  }

  get config(): ScenarioConfig {
    return this.custom ?? NAMED[this.active];
  }

  resolveFromCard(cardNumber: string): void {
    const MAP: Record<string, ScenarioName> = {
      "4242424242424242": "success",
      "4000000000000002": "cardDeclined",
      "4000000000009995": "insufficientFunds",
      "4000000000000069": "expiredCard",
      "4000000000000127": "incorrectCvc",
      "4000002500003155": "requiresAction",
    };
    const s = MAP[cardNumber];
    if (s) this.setScenario(s);
  }

  paymentIntentStatus(): PaymentIntentStatus {
    return this.config.paymentIntent?.status ?? "succeeded";
  }

  subscriptionStatus(): SubscriptionStatus {
    return this.config.subscription?.status ?? "active";
  }

  shouldRequireAction(): boolean {
    return this.config.paymentIntent?.requiresAction === true;
  }

  getFailError(): StripeError | undefined {
    return this.config.paymentIntent?.failWithError;
  }
}