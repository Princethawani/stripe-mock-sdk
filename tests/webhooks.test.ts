import { describe, it, expect, beforeEach, vi } from "vitest";
import { StripeMock } from "../index";

let stripe: StripeMock;

beforeEach(() => {
  stripe = new StripeMock();
});

describe("webhooks", () => {
  it("fires payment_intent.succeeded on successful confirm", async () => {
    const handler = vi.fn();
    stripe.webhooks.on("payment_intent.succeeded", handler);

    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    await stripe.paymentIntents.create({
      amount: 1000, currency: "usd", payment_method: pm.id, confirm: true,
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].type).toBe("payment_intent.succeeded");
    expect(handler.mock.calls[0][0].data.object.status).toBe("succeeded");
  });

  it("fires payment_intent.payment_failed on decline", async () => {
    const handler = vi.fn();
    stripe.webhooks.on("payment_intent.payment_failed", handler);
    stripe.use("cardDeclined");

    const pi = await stripe.paymentIntents.create({ amount: 500, currency: "usd" });
    await stripe.paymentIntents.confirm(pi.id, { payment_method: "pm_fake" }).catch(() => {});

    expect(handler).toHaveBeenCalledOnce();
  });

  it("fires subscription lifecycle events", async () => {
    const created = vi.fn();
    const deleted = vi.fn();
    stripe.webhooks.on("customer.subscription.created", created);
    stripe.webhooks.on("customer.subscription.deleted", deleted);

    const c = await stripe.customers.create({});
    const sub = await stripe.subscriptions.create({
      customer: c.id,
      items: [{ price: "price_basic_monthly" }],
    });
    await stripe.subscriptions.cancel(sub.id);

    expect(created).toHaveBeenCalledOnce();
    expect(deleted).toHaveBeenCalledOnce();
  });

  it("fires charge.refunded on refund", async () => {
    const handler = vi.fn();
    stripe.webhooks.on("charge.refunded", handler);

    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    const pi = await stripe.paymentIntents.create({
      amount: 2000, currency: "usd", payment_method: pm.id, confirm: true,
    });
    await stripe.refunds.create({ charge: pi.charges.data[0].id });

    expect(handler).toHaveBeenCalledOnce();
  });

  it("stores full event history", async () => {
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    await stripe.paymentIntents.create({
      amount: 500, currency: "usd", payment_method: pm.id, confirm: true,
    });

    const types = stripe.webhooks.getHistory().map((e) => e.type);
    expect(types).toContain("payment_intent.created");
    expect(types).toContain("payment_intent.succeeded");
    expect(types).toContain("charge.succeeded");
  });

  it("constructEvent builds a valid event payload", () => {
    const event = stripe.webhooks.constructEvent("invoice.paid", { id: "in_test", amount_paid: 999 });
    expect(event.type).toBe("invoice.paid");
    expect(event.object).toBe("event");
    expect(event.data.object).toMatchObject({ id: "in_test" });
  });

  it("supports listening to multiple event types at once", async () => {
    const handler = vi.fn();
    stripe.webhooks.on(["payment_intent.created", "payment_intent.succeeded"], handler);

    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    await stripe.paymentIntents.create({
      amount: 1000, currency: "usd", payment_method: pm.id, confirm: true,
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });
});