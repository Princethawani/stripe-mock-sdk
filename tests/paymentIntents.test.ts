import { describe, it, expect, beforeEach } from "vitest";
import { StripeMock, StripeMockError } from "../index";

let stripe: StripeMock;

beforeEach(() => {
  stripe = new StripeMock();
});

describe("paymentIntents.create", () => {
  it("creates with requires_payment_method status by default", async () => {
    const pi = await stripe.paymentIntents.create({ amount: 2000, currency: "usd" });

    expect(pi.id).toMatch(/^pi_/);
    expect(pi.amount).toBe(2000);
    expect(pi.currency).toBe("usd");
    expect(pi.status).toBe("requires_payment_method");
    expect(pi.client_secret).toContain(pi.id);
    expect(pi.livemode).toBe(false);
  });

  it("throws on zero amount", async () => {
    await expect(
      stripe.paymentIntents.create({ amount: 0, currency: "usd" })
    ).rejects.toBeInstanceOf(StripeMockError);
  });

  it("auto-confirms when confirm=true and payment_method provided", async () => {
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });

    const pi = await stripe.paymentIntents.create({
      amount: 1000,
      currency: "usd",
      payment_method: pm.id,
      confirm: true,
    });

    expect(pi.status).toBe("succeeded");
    expect(pi.amount_received).toBe(1000);
  });
});

describe("paymentIntents.confirm", () => {
  it("succeeds with a valid payment method", async () => {
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });

    const pi = await stripe.paymentIntents.create({ amount: 5000, currency: "gbp" });
    const confirmed = await stripe.paymentIntents.confirm(pi.id, { payment_method: pm.id });

    expect(confirmed.status).toBe("succeeded");
    expect(confirmed.amount_received).toBe(5000);
    expect(confirmed.charges.data[0].id).toMatch(/^ch_/);
  });

  it("fails with cardDeclined scenario", async () => {
    stripe.use("cardDeclined");
    const pi = await stripe.paymentIntents.create({ amount: 1000, currency: "usd" });

    await expect(
      stripe.paymentIntents.confirm(pi.id, { payment_method: "pm_fake" })
    ).rejects.toMatchObject({
      stripeError: { type: "card_error", code: "card_declined", decline_code: "generic_decline" },
    });
  });

  it("fails with insufficientFunds scenario", async () => {
    stripe.use("insufficientFunds");
    const pi = await stripe.paymentIntents.create({ amount: 9999, currency: "usd" });

    await expect(
      stripe.paymentIntents.confirm(pi.id, { payment_method: "pm_fake" })
    ).rejects.toMatchObject({ stripeError: { decline_code: "insufficient_funds" } });
  });

  it("sets requires_action status for 3DS scenario", async () => {
    stripe.use("requiresAction");
    const pi = await stripe.paymentIntents.create({ amount: 2000, currency: "usd" });
    const result = await stripe.paymentIntents.confirm(pi.id, { payment_method: "pm_fake" });

    expect(result.status).toBe("requires_action");
  });

  it("resolves scenario from test card number", async () => {
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4000000000000002", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    const pi = await stripe.paymentIntents.create({ amount: 1000, currency: "usd" });

    await expect(
      stripe.paymentIntents.confirm(pi.id, { payment_method: pm.id })
    ).rejects.toMatchObject({ stripeError: { code: "card_declined" } });
  });

  it("is idempotent for succeeded intents", async () => {
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    const pi = await stripe.paymentIntents.create({
      amount: 1000, currency: "usd", payment_method: pm.id, confirm: true,
    });
    const again = await stripe.paymentIntents.confirm(pi.id);

    expect(again.status).toBe("succeeded");
    expect(again.id).toBe(pi.id);
  });
});

describe("paymentIntents.cancel", () => {
  it("cancels a pending intent", async () => {
    const pi = await stripe.paymentIntents.create({ amount: 500, currency: "usd" });
    const canceled = await stripe.paymentIntents.cancel(pi.id);

    expect(canceled.status).toBe("canceled");
    expect(canceled.canceled_at).toBeGreaterThan(0);
  });

  it("throws when canceling a succeeded intent", async () => {
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    const pi = await stripe.paymentIntents.create({
      amount: 1000, currency: "usd", payment_method: pm.id, confirm: true,
    });

    await expect(stripe.paymentIntents.cancel(pi.id)).rejects.toBeInstanceOf(StripeMockError);
  });
});