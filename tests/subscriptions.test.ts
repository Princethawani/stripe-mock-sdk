import { describe, it, expect, beforeEach } from "vitest";
import { StripeMock, StripeMockError } from "../index";

let stripe: StripeMock;

beforeEach(() => {
  stripe = new StripeMock();
});

describe("customers", () => {
  it("creates a customer", async () => {
    const c = await stripe.customers.create({ email: "ada@example.com", name: "Ada Lovelace" });
    expect(c.id).toMatch(/^cus_/);
    expect(c.email).toBe("ada@example.com");
  });

  it("retrieves a customer", async () => {
    const c = await stripe.customers.create({ email: "a@b.com" });
    const found = await stripe.customers.retrieve(c.id);
    expect(found.id).toBe(c.id);
  });

  it("updates a customer", async () => {
    const c = await stripe.customers.create({ email: "old@test.com" });
    const updated = await stripe.customers.update(c.id, { email: "new@test.com" });
    expect(updated.email).toBe("new@test.com");
  });

  it("deletes a customer and throws on retrieve", async () => {
    const c = await stripe.customers.create({ email: "bye@test.com" });
    await stripe.customers.del(c.id);
    await expect(stripe.customers.retrieve(c.id)).rejects.toBeInstanceOf(StripeMockError);
  });

  it("lists customers filtered by email", async () => {
    await stripe.customers.create({ email: "a@test.com" });
    await stripe.customers.create({ email: "b@test.com" });
    const list = await stripe.customers.list({ email: "a@test.com" });
    expect(list.data).toHaveLength(1);
  });
});

describe("subscriptions", () => {
  it("creates an active subscription", async () => {
    const c = await stripe.customers.create({});
    const sub = await stripe.subscriptions.create({
      customer: c.id,
      items: [{ price: "price_basic_monthly" }],
    });

    expect(sub.id).toMatch(/^sub_/);
    expect(sub.status).toBe("active");
    expect(sub.items.data[0].price.id).toBe("price_basic_monthly");
  });

  it("creates a trialing subscription", async () => {
    const c = await stripe.customers.create({});
    const sub = await stripe.subscriptions.create({
      customer: c.id,
      items: [{ price: "price_pro_monthly" }],
      trial_period_days: 14,
    });

    expect(sub.trial_end).not.toBeNull();
    expect(sub.trial_end!).toBeGreaterThan(sub.trial_start!);
  });

  it("cancels a subscription", async () => {
    const c = await stripe.customers.create({});
    const sub = await stripe.subscriptions.create({
      customer: c.id,
      items: [{ price: "price_basic_monthly" }],
    });
    const canceled = await stripe.subscriptions.cancel(sub.id);

    expect(canceled.status).toBe("canceled");
    expect(canceled.canceled_at).not.toBeNull();
  });

  it("reflects past_due via custom scenario", async () => {
    stripe.useCustom({ subscription: { status: "past_due" } });
    const c = await stripe.customers.create({});
    const sub = await stripe.subscriptions.create({
      customer: c.id,
      items: [{ price: "price_basic_monthly" }],
    });
    expect(sub.status).toBe("past_due");
  });

  it("throws 404 for unknown customer", async () => {
    await expect(
      stripe.subscriptions.create({ customer: "cus_ghost", items: [{ price: "price_basic_monthly" }] })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lists subscriptions by customer", async () => {
    const c = await stripe.customers.create({});
    await stripe.subscriptions.create({ customer: c.id, items: [{ price: "price_basic_monthly" }] });
    await stripe.subscriptions.create({ customer: c.id, items: [{ price: "price_pro_monthly" }] });
    const list = await stripe.subscriptions.list({ customer: c.id });
    expect(list.data).toHaveLength(2);
  });
});

describe("refunds", () => {
  async function makeCharge(amount = 3000) {
    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    const pi = await stripe.paymentIntents.create({
      amount, currency: "usd", payment_method: pm.id, confirm: true,
    });
    return pi.charges.data[0].id;
  }

  it("creates a full refund", async () => {
    const chargeId = await makeCharge();
    const refund = await stripe.refunds.create({ charge: chargeId });
    expect(refund.id).toMatch(/^re_/);
    expect(refund.amount).toBe(3000);
    expect(refund.status).toBe("succeeded");
  });

  it("creates a partial refund", async () => {
    const chargeId = await makeCharge(5000);
    const refund = await stripe.refunds.create({ charge: chargeId, amount: 2000 });
    expect(refund.amount).toBe(2000);
  });

  it("throws when refund exceeds charge amount", async () => {
    const chargeId = await makeCharge(1000);
    await expect(
      stripe.refunds.create({ charge: chargeId, amount: 9999 })
    ).rejects.toMatchObject({ stripeError: { code: "amount_too_large" } });
  });
});

describe("StripeMock.reset()", () => {
  it("clears all customers", async () => {
    await stripe.customers.create({ email: "a@a.com" });
    stripe.reset();
    const list = await stripe.customers.list();
    expect(list.data).toHaveLength(0);
  });

  it("resets scenario to success after use()", async () => {
    stripe.use("cardDeclined");
    stripe.reset();

    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { number: "4242424242424242", exp_month: 12, exp_year: 2028, cvc: "123" },
    });
    const pi = await stripe.paymentIntents.create({
      amount: 1000, currency: "usd", payment_method: pm.id, confirm: true,
    });
    expect(pi.status).toBe("succeeded");
  });
});