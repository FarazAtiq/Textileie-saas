import {
  CreditCard, Users, LayoutGrid, Calendar, HardDrive, Lock, CheckCircle2, Mail,
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

function ProgressBar({ percent, color }) {
  return (
    <div style={{ height: 6, borderRadius: 4, background: "#eef1f4", overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(Math.max(percent, 0), 100)}%`,
        background: color,
        borderRadius: 4,
        transition: "width 0.3s ease",
      }} />
    </div>
  );
}

export default function SubscriptionStatusCard() {
  const { access } = useAuth();
  const subscription = access?.subscription;
  const seatSummary = access?.seatSummary;
  const enabledModules = access?.enabledModules;

  if (!access?.hasConfiguredAccess || !subscription) return null;

  const planInfo = PLANS.find((p) => p.id === subscription.plan);
  const planName = planInfo?.name || (subscription.plan === "trial" ? "Trial" : subscription.plan || "—");
  const status = subscription.effectiveStatus;
  const isTrial = status === "Trial" || status === "Expired";
  const daysRemaining = isTrial ? subscription.trialDaysRemaining : subscription.renewalDaysRemaining;
  const renewalDate = isTrial ? subscription.trialEndsAt : subscription.expiresAt;
  const billingCycle = isTrial ? null : inferBillingCycle(subscription.startsAt, subscription.expiresAt);
  const colors = STATUS_COLORS[status] || STATUS_COLORS.Active;
  const enabledCount = enabledModules ? Object.values(enabledModules).filter(Boolean).length : null;
  const isReadOnly = status === "Expired" || status === "Suspended" || status === "Cancelled";

  const seatPercent = seatSummary?.licensed_users
    ? (seatSummary.active_users / seatSummary.licensed_users) * 100
    : null;
  const seatColor = seatPercent == null ? "var(--teal)"
    : seatPercent >= 100 ? "#dc2626"
    : seatPercent >= 80 ? "#ea580c"
    : "var(--teal)";

  const periodStart = subscription.startsAt;
  const periodEnd = renewalDate;
  let elapsedPercent = null;
  if (periodStart && periodEnd) {
    const total = new Date(periodEnd) - new Date(periodStart);
    const elapsed = Date.now() - new Date(periodStart);
    elapsedPercent = total > 0 ? (elapsed / total) * 100 : null;
  }
  const daysColor = daysRemaining == null ? "var(--teal)"
    : daysRemaining <= 3 ? "#dc2626"
    : daysRemaining <= 7 ? "#ea580c"
    : "var(--teal)";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12,
        borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 12, marginBottom: 4 }}>
            <CreditCard size={14} /> SUBSCRIPTION
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{planName} Plan</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isReadOnly ? (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#991b1b" }}>
              <Lock size={13} /> Read-only workspace
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--teal-dark)" }}>
              <CheckCircle2 size={13} /> Fully active
            </span>
          )}
          <span style={{
            background: colors.bg, color: colors.fg,
            fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
          }}>
            {status?.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)" }}>
              <Calendar size={13} />
              {isTrial ? "Trial ends" : "Renews"} {formatDate(renewalDate)}
              {billingCycle && ` · ${billingCycle}`}
            </div>
            {daysRemaining != null && (
              <strong style={{ fontSize: 13, color: daysColor }}>
                {Math.max(daysRemaining, 0)} day{Math.max(daysRemaining, 0) === 1 ? "" : "s"} left
              </strong>
            )}
          </div>
          {elapsedPercent != null && <ProgressBar percent={elapsedPercent} color={daysColor} />}
        </div>

        {seatSummary && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)" }}>
                <Users size={13} /> Seats used
              </div>
              <strong style={{ fontSize: 13, color: seatColor }}>
                {seatSummary.active_users} / {seatSummary.licensed_users}
              </strong>
            </div>
            {seatPercent != null && <ProgressBar percent={seatPercent} color={seatColor} />}
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: "var(--text-secondary)" }}>
              <span>Pending: <strong style={{ color: "var(--text-primary)" }}>{seatSummary.pending_invitations}</strong></span>
              <span>Available: <strong style={{ color: "var(--text-primary)" }}>{seatSummary.available_seats}</strong></span>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16 }}>
          <StatChip icon={LayoutGrid} label="Enabled Modules" value={enabledCount != null ? enabledCount : "—"} />
          <StatChip icon={HardDrive} label="Storage Usage" value="Not yet tracked" />
        </div>
      </div>

      <div style={{
        padding: "12px 24px",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
          Subscription changes are handled by the TextileIE team.
        </span>
        <a
          href="mailto:support@textileie.com"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--teal-dark)", textDecoration: "none" }}
        >
          <Mail size={13} /> Contact TextileIE Sales
        </a>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 11.5, marginBottom: 4 }}>
        <Icon size={12} />
        {label}
      </div>
      <strong style={{ fontSize: 14 }}>{value}</strong>
    </div>
  );
}
