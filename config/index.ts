export const config = {
  apiVersion: "2026-03-25",
  livemode: false as const,
  defaultCurrency: "mwk",
  defaultCountry: "MW",
  defaultPrices: [
    {
      id: "price_basic_monthly",
      currency: "mwk",
      unit_amount: 500000,   // MK 5,000 / month
      interval: "month" as const,
      interval_count: 1,
      product: "prod_basic",
    },
    {
      id: "price_pro_monthly",
      currency: "mwk",
      unit_amount: 1500000,  // MK 15,000 / month
      interval: "month" as const,
      interval_count: 1,
      product: "prod_pro",
    },
    {
      id: "price_pro_yearly",
      currency: "mwk",
      unit_amount: 15000000, // MK 150,000 / year
      interval: "year" as const,
      interval_count: 1,
      product: "prod_pro",
    },
  ],
};