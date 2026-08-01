import { Building2 } from "lucide-react";

export default function CompanySummarySection({ company }) {
  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Building2 size={19} />
        Company
      </h2>
      <div className="divider" />
      <Row label="Company Name" value={company?.companyName} />
      <Row label="Company Code" value={company?.companyCode} />
      <Row label="Business Type" value={company?.businessType} />
      <Row label="Industry" value={company?.industry} />
      <Row label="Country" value={company?.country} />
      <Row label="Currency" value={company?.currency} />
      <Row label="Timezone" value={company?.timezone} />
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
