import { CreditCard } from "lucide-react";

export default function SubscriptionSummarySection({ subscription, billing }) {
  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CreditCard size={19} />
        Subscription
      </h2>
      <div className="divider" />
      <Row label="Plan" value={subscription?.planName} />
      <Row label="Billing Cycle" value={billing?.cycle === "annual" ? "Annual" : "Monthly"} />
      <Row
        label="Price"
        value={billing?.isCustom ? "Custom Pricing" : `$${billing?.basePrice ?? 0}`}
      />
      <Row label="Factories" value={subscription?.limits?.factories} />
      <Row label="Users" value={subscription?.limits?.users} />
      <Row label="Storage" value={subscription?.limits?.storage} />
      <Row label="AI Credits" value={subscription?.limits?.aiCredits} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}
