import {
  CreditCard, Users, LayoutGrid, Calendar, HardDrive,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { PLANS } from "../customer-onboarding/steps/SubscriptionStep.jsx";

const STATUS_COLORS = {
  Trial: { bg: "var(--teal-light)", fg: "var(--teal-dark)" },
  Active: { bg: "var(--teal-light)", fg: "var(--teal-dark)" },
  "Pending Renewal": { bg: "#fff7ed", fg: "#9a3412" },
  Expired: { bg: "var(--red-light, #fdecea)", fg: "#991b1b" },
  Suspended: { bg: "var(--red-light, #fdecea)", fg: "#991b1b" },
  Cancelled: { bg: "var(--red-light, #fdecea)", fg: "#991b1b" },
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function inferBillingCycle(startsAt, expiresAt) {
  if (!startsAt || !expiresAt) return null;
  const days = (new Date(expiresAt) - new Date(startsAt)) / (1000 * 60 * 60 * 24);
  return days > 200 ? "Annual" : "Monthly";
}

export default function SubscriptionStatusCard() {
  const { access } = useAuth();
  const subscription = access?.subscription;
  const seatSummary = access?.seatSummary;
  const enabledModules = access?.enabledModules;

  if (!access?.hasConfiguredAccess || !subscription) return null;

  const planInfo = PLANS.find((p) => p.id === subscription.plan);
  const planName = planInfo?.name || (subscription.plan === "trial" ? "Trial" : subscription.plan || "—");
  const isTrial = subscription.effectiveStatus === "Trial" || subscription.effectiveStatus === "Expired";
  const daysRemaining = isTrial ? subscription.trialDaysRemaining : subscription.renewalDaysRemaining;
  const renewalDate = isTrial ? subscription.trialEndsAt : subscription.expiresAt;
  const billingCycle = isTrial ? null : inferBillingCycle(subscription.startsAt, subscription.expiresAt);
  const colors = STATUS_COLORS[subscription.effectiveStatus] || STATUS_COLORS.Active;
  const enabledCount = enabledModules ? Object.values(enabledModules).filter(Boolean).length : null;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
          <CreditCard size={18} />
          Subscription
        </h2>
        <span style={{
          background: colors.bg, color: colors.fg,
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
        }}>
          {subscription.effectiveStatus?.toUpperCase()}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16 }}>
        <Field label="Plan" value={planName} />
        <Field label="Type" value={isTrial ? "Trial" : "Paid"} />
        {billingCycle && <Field label="Billing Cycle" value={billingCycle} />}
        <Field
          label={isTrial ? "Trial Ends" : "Renewal Date"}
          value={formatDate(renewalDate)}
          icon={Calendar}
        />
        <Field
          label="Days Remaining"
          value={daysRemaining != null ? Math.max(daysRemaining, 0) : "—"}
        />
      </div>

      {seatSummary && (
        <>
          <div className="divider" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Users size={15} />
            <strong style={{ fontSize: 13 }}>Seats</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 16 }}>
            <Field label="Licensed" value={seatSummary.licensed_users} />
            <Field label="Active" value={seatSummary.active_users} />
            <Field label="Pending" value={seatSummary.pending_invitations} />
            <Field label="Available" value={seatSummary.available_seats} />
          </div>
        </>
      )}

      <div className="divider" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16 }}>
        <Field label="Enabled Modules" value={enabledCount != null ? enabledCount : "—"} icon={LayoutGrid} />
        <Field label="Storage Usage" value="Not yet tracked" icon={HardDrive} />
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 11.5, marginBottom: 4 }}>
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <strong style={{ fontSize: 14 }}>{value}</strong>
    </div>
  );
}
