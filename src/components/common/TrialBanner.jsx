import { Clock, ShieldCheck, Mail, Phone, MessageCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";

export default function TrialBanner() {
  const { access } = useAuth();
  const subscription = access?.subscription;

  if (!access?.hasConfiguredAccess || access?.isPlatformAdmin) return null;
  if (!subscription || String(subscription.status).toLowerCase() !== "trial") return null;

  if (subscription.isTrialExpired) {
    return (
      <div style={{
        background: "var(--red-light, #fdecea)",
        borderBottom: "1px solid rgba(220,38,38,0.25)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <ShieldCheck size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <strong style={{ color: "#991b1b", fontSize: 13 }}>
            Your TextileIE trial has expired.
          </strong>
          <p style={{ color: "#7f1d1d", fontSize: 12, marginTop: 2 }}>
            Your data is completely safe and nothing has been deleted. Your workspace
            is now read-only until your subscription is activated.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="mailto:support@textileie.com"
            style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              fontSize: 12, fontWeight: 600, color: "#991b1b",
              border: "1px solid rgba(220,38,38,0.3)", padding: "6px 12px", borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <Mail size={13} /> Email
          </a>
          <a
            href="tel:+923253272020"
            style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              fontSize: 12, fontWeight: 600, color: "#991b1b",
              border: "1px solid rgba(220,38,38,0.3)", padding: "6px 12px", borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <Phone size={13} /> Call
          </a>
          <a
            href="https://wa.me/923253272020"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              fontSize: 12, fontWeight: 600, color: "#991b1b",
              border: "1px solid rgba(220,38,38,0.3)", padding: "6px 12px", borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const days = subscription.trialDaysRemaining;
  if (days == null) return null;

  const urgent = days <= 5;

  return (
    <div style={{
      background: urgent ? "#fff7ed" : "var(--teal-light)",
      borderBottom: `1px solid ${urgent ? "rgba(234,88,12,0.25)" : "rgba(13,122,107,0.2)"}`,
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12,
      color: urgent ? "#9a3412" : "var(--teal-dark)",
    }}>
      <Clock size={15} style={{ flexShrink: 0 }} />
      <span>
        {days > 0
          ? <>Trial workspace — <strong>{days} day{days === 1 ? "" : "s"}</strong> remaining.</>
          : <>Trial workspace — expires today.</>}
      </span>
    </div>
  );
}
