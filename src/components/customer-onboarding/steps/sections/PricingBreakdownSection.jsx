import { Receipt } from "lucide-react";

export default function PricingBreakdownSection({ subscription, billing }) {
  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Receipt size={19} />
        Pricing Breakdown
      </h2>
      <div className="divider" />

      <Row label="Plan" value={subscription?.planName || "—"} />
      <Row
        label={billing?.cycle === "annual" ? "Annual Price" : "Monthly Price"}
        value={billing?.isCustom ? "Custom" : `$${billing?.basePrice ?? 0}`}
      />

      <div className="divider" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Total</strong>
        <strong style={{ fontSize: 22 }}>
          {billing?.isCustom ? "Custom" : `$${billing?.total ?? 0}`}
          {!billing?.isCustom && (
            <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
              /{billing?.cycle === "annual" ? "year" : "month"}
            </span>
          )}
        </strong>
      </div>

      {billing?.isCustom && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10 }}>
          Enterprise pricing is finalized with your account manager.
        </p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
