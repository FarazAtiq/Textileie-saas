import { Factory } from "lucide-react";

export default function FactorySummarySection({ factory }) {
  if (!factory) {
    return (
      <div className="card">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Factory size={19} />
          Factory
        </h2>
        <div className="divider" />
        <p style={{ color: "var(--text-secondary)" }}>No factory configured.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Factory size={19} />
        Factory
      </h2>
      <div className="divider" />
      <Row label="Factory Name" value={factory.factoryName} />
      <Row label="Factory Code" value={factory.factoryCode} />
      <Row label="Type" value={factory.factoryType} />
      <Row label="City" value={factory.city} />
      <Row label="Country" value={factory.country} />
      <Row label="Total Employees" value={factory.totalEmployees} />
      <Row label="Production Lines" value={factory.productionLines} />
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
