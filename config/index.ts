export const config = {
  apiVersion: "2023-10-16",
  livemode: false as const,
  defaultPrices: [
    {
      id: "price_basic_monthly",
      currency: "usd",
      unit_amount: 999,
      interval: "month" as const,
      interval_count: 1,
      product: "prod_basic",
    },
    {
      id: "price_pro_monthly",
      currency: "usd",
      unit_amount: 2999,
      interval: "month" as const,
      interval_count: 1,
      product: "prod_pro",
    },
    {
      id: "price_pro_yearly",
      currency: "usd",
      unit_amount: 29900,
      interval: "year" as const,
      interval_count: 1,
      product: "prod_pro",
    },
  ],
};