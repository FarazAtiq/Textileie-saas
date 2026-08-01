import { User } from "lucide-react";

export default function OwnerSummarySection({ owner }) {
  const fullName = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ");

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <User size={19} />
        Owner & Administrator
      </h2>
      <div className="divider" />
      <Row label="Name" value={fullName} />
      <Row label="Email" value={owner?.email} />
      <Row label="Phone" value={owner?.phone} />
      <Row label="Username" value={owner?.username} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
