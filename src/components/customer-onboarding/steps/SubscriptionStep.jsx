import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Building2,
  Users,
  Database,
  Sparkles,
} from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "For small factories starting their digital engineering workspace.",
    monthlyPrice: 49,
    annualPrice: 490,
    limits: { factories: 1, users: 10, storage: "10 GB", aiCredits: 500 },
    features: [
      "Core engineering tools",
      "Standard reports",
      "Email support",
      "Single-factory workspace",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing manufacturers managing multiple teams and factories.",
    monthlyPrice: 149,
    annualPrice: 1490,
    recommended: true,
    limits: { factories: 5, users: 100, storage: "100 GB", aiCredits: 5000 },
    features: [
      "Advanced engineering tools",
      "Multi-factory workspace",
      "Advanced reports",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large manufacturing groups requiring custom limits and integrations.",
    monthlyPrice: null,
    annualPrice: null,
    limits: {
      factories: "Unlimited",
      users: "Unlimited",
      storage: "Custom",
      aiCredits: "Custom",
    },
    features: [
      "Custom modules and limits",
      "ERP and API integration",
      "Dedicated onboarding",
      "Enterprise support",
    ],
  },
];

export default function SubscriptionStep({
  initialPlan = "professional",
  initialBillingCycle = "monthly",
  onPrevious,
  onNext,
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [billingCycle, setBillingCycle] = useState(initialBillingCycle);

  const selectedPlan = useMemo(
    () => PLANS.find((plan) => plan.id === selectedPlanId) || PLANS[1],
    [selectedPlanId]
  );

  const displayedPrice =
    billingCycle === "annual"
      ? selectedPlan.annualPrice
      : selectedPlan.monthlyPrice;

  const handleNext = () => {
    onNext?.({
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      billingCycle,
      monthlyPrice: selectedPlan.monthlyPrice,
      annualPrice: selectedPlan.annualPrice,
      limits: selectedPlan.limits,
    });
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={19} />
              Subscription Plan
            </h2>
            <p style={{ margin: "6px 0 0" }}>
              Select the commercial plan for this TextileIE workspace.
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              gap: 6,
              padding: 4,
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "var(--bg)",
            }}
          >
            <button
              type="button"
              className={billingCycle === "monthly" ? "btn btn-primary" : "btn btn-secondary"}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={billingCycle === "annual" ? "btn btn-primary" : "btn btn-secondary"}
              onClick={() => setBillingCycle("annual")}
            >
              Annual
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
          marginBottom: 20,
        }}
      >
        {PLANS.map((plan) => {
          const selected = selectedPlanId === plan.id;
          const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              className="card"
              style={{
                position: "relative",
                textAlign: "left",
                cursor: "pointer",
                border: selected ? "2px solid var(--teal)" : "1px solid var(--border)",
                padding: 20,
              }}
            >
              {plan.recommended && (
                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "5px 8px",
                    borderRadius: 999,
                    background: "var(--teal)",
                    color: "#fff",
                  }}
                >
                  RECOMMENDED
                </span>
              )}

              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                  background: selected ? "var(--teal)" : "var(--bg)",
                  color: selected ? "#fff" : "var(--text-primary)",
                }}
              >
                {selected ? <Check size={18} /> : <CreditCard size={18} />}
              </div>

              <h2 style={{ marginBottom: 6 }}>{plan.name}</h2>
              <p style={{ minHeight: 54 }}>{plan.description}</p>
              <div className="divider"></div>

              <div style={{ marginBottom: 16 }}>
                {price == null ? (
                  <strong style={{ fontSize: 24 }}>Custom Pricing</strong>
                ) : (
                  <>
                    <strong style={{ fontSize: 28 }}>${price}</strong>
                    <span style={{ marginLeft: 5 }}>
                      /{billingCycle === "annual" ? "year" : "month"}
                    </span>
                  </>
                )}
              </div>

              <div style={{ display: "grid", gap: 9 }}>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={15} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div className="card">
          <h2>Workspace Limits</h2>
          <div className="divider"></div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 14,
            }}
          >
            <LimitCard icon={Building2} label="Factories" value={selectedPlan.limits.factories} />
            <LimitCard icon={Users} label="Users" value={selectedPlan.limits.users} />
            <LimitCard icon={Database} label="Storage" value={selectedPlan.limits.storage} />
            <LimitCard icon={Sparkles} label="AI Credits" value={selectedPlan.limits.aiCredits} />
          </div>
        </div>

        <div className="card">
          <h2>Selection Summary</h2>
          <div className="divider"></div>
          <SummaryRow label="Plan" value={selectedPlan.name} />
          <SummaryRow label="Billing" value={billingCycle === "annual" ? "Annual" : "Monthly"} />
          <SummaryRow label="Price" value={displayedPrice == null ? "Custom" : `$${displayedPrice}`} />
          <SummaryRow label="Factories" value={selectedPlan.limits.factories} />
          <SummaryRow label="Users" value={selectedPlan.limits.users} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button type="button" className="btn btn-secondary" onClick={onPrevious}>
          <ArrowLeft size={16} />
          Previous
        </button>

        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Continue to Modules
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function LimitCard({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--bg)",
      }}
    >
      <Icon size={18} />
      <div style={{ marginTop: 10, fontSize: 12 }}>{label}</div>
      <strong style={{ display: "block", marginTop: 4 }}>{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
