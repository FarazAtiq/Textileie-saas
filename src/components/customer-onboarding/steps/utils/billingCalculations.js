// Calculates the billing estimate shown on the Billing Summary step.
// Pricing is driven entirely by the selected subscription plan (see
// SubscriptionStep.jsx PLANS). Workspace features are informational only
// (no per-feature pricing exists yet), so they're passed through for
// display but don't affect the total.
export function calculateBillingSummary({ subscription, workspaceFeatures }) {
  const cycle = subscription?.billingCycle || "monthly";
  const isCustom =
    subscription?.monthlyPrice == null && subscription?.annualPrice == null;

  const basePrice = isCustom
    ? null
    : cycle === "annual"
    ? subscription?.annualPrice ?? 0
    : subscription?.monthlyPrice ?? 0;

  return {
    currency: "USD",
    cycle,
    isCustom,
    basePrice,
    featureCount: workspaceFeatures?.count ?? 0,
    total: basePrice, // no add-on pricing exists yet; base plan is the total
  };
}
