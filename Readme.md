# stripe-mock-sdk

A TypeScript drop-in mock of the Stripe SDK for unit testing payments, subscriptions, and webhooks — **no network calls, no API keys, no test mode needed**.

## Features

- Full TypeScript types — same shape as the real Stripe SDK
- Scenario control via named presets or custom configs
- Test card numbers resolve scenarios automatically
- Webhook event listeners with full history inspection
- `reset()` for clean test isolation
- Zero runtime dependencies

## Installation

```bash
npm install stripe-mock-sdk --save-dev
```

## Quick start

```typescript
import { StripeMock } from "stripe-mock-sdk";

const stripe = new StripeMock();

// Create a customer and charge them (amounts in tambala — MK 1 = 100 tambala)
const customer = await stripe.customers.create({ email: "prince@example.mw" });
const pm = await stripe.paymentMethods.create({
  type: "card",
  card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
});

const pi = await stripe.paymentIntents.create({
  amount: 200000,    // MK 2,000
  currency: "mwk",
  customer: customer.id,
  payment_method: pm.id,
  confirm: true,
});

console.log(pi.status);   // "succeeded"
console.log(pi.currency); // "mwk"
```

## Scenario control

### Named scenarios

```typescript
stripe.use("cardDeclined");
stripe.use("insufficientFunds");
stripe.use("expiredCard");
stripe.use("incorrectCvc");
stripe.use("requiresAction");  // triggers 3DS
stripe.use("networkError");
stripe.use("success");         // default
```

### Test card numbers (auto-resolve scenario)

| Card number | Scenario |
|---|---|
| `4242 4242 4242 4242` | success |
| `4000 0000 0000 0002` | card_declined |
| `4000 0000 0000 9995` | insufficient_funds |
| `4000 0000 0000 0069` | expired_card |
| `4000 0000 0000 0127` | incorrect_cvc |
| `4000 0025 0000 3155` | requires_action (3DS) |

### Custom scenario

```typescript
stripe.useCustom({
  paymentIntent: { status: "requires_capture" },
  subscription: { status: "past_due" },
});
```

## Webhooks

```typescript
// Listen to events
stripe.webhooks.on("payment_intent.succeeded", (event) => {
  console.log(event.data.object.id);
});

// Listen to multiple events at once
stripe.webhooks.on(
  ["customer.subscription.created", "customer.subscription.deleted"],
  (event) => { ... }
);

// Inspect history in tests
const events = stripe.webhooks.getHistory();
const succeeded = stripe.webhooks.getEventsOfType("payment_intent.succeeded");

// Build a webhook payload for endpoint testing
const event = stripe.webhooks.constructEvent("invoice.paid", invoiceObject);
```

## Subscriptions

Default prices are seeded automatically (amounts in tambala, MK 1 = 100 tambala):

| Price ID | Amount | Interval |
|---|---|---|
| `price_basic_monthly` | MK 5,000 / month | monthly |
| `price_pro_monthly` | MK 15,000 / month | monthly |
| `price_pro_yearly` | MK 150,000 / year | yearly |

```typescript
const customer = await stripe.customers.create({ email: "thandiwe@example.mw" });
const sub = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: "price_pro_monthly" }],
  trial_period_days: 14,
});
```

## Test isolation

Call `reset()` in `beforeEach` to clear all state:

```typescript
import { describe, it, beforeEach } from "vitest";
import { StripeMock } from "stripe-mock-sdk";

const stripe = new StripeMock();

beforeEach(() => {
  stripe.reset(); // clears store, resets scenario, removes webhook handlers
});
```

## Error handling

Failed calls throw `StripeMockError` with the same shape as real Stripe errors:

```typescript
import { StripeMockError } from "stripe-mock-sdk";

try {
  await stripe.paymentIntents.confirm(pi.id, { payment_method: pm.id });
} catch (err) {
  if (err instanceof StripeMockError) {
    console.log(err.stripeError.code);        // "card_declined"
    console.log(err.stripeError.decline_code); // "insufficient_funds"
    console.log(err.statusCode);               // 402
  }
}
```

## Project structure

```
stripe-mock-sdk/
├── config/          # App-wide config (API version, default prices)
├── middlewares/     # Error helpers and request logger
├── shared/          # ID generator, time helpers, card scenario map
├── src/
│   ├── customers/
│   │   ├── infrastructure/  # CustomerStore (in-memory)
│   │   ├── interface/       # CustomersResource + types
│   │   └── service/         # CustomerService (business logic)
│   ├── paymentIntents/      # Same three-layer structure
│   ├── paymentMethods/
│   ├── subscriptions/
│   ├── refunds/
│   └── webhooks/
├── utils/           # ScenarioEngine
├── tests/           # Vitest specs
├── index.ts         # Composition root — wires all layers
├── tsconfig.json
└── package.json
```

## Scripts

```bash
npm test            # run all tests once
npm run test:watch  # watch mode
npm run build       # compile to dist/
npm run lint        # type-check only (no emit)
```

## License

MIT