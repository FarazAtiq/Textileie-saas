import { Settings, Check } from "lucide-react";

export default function WorkspaceSummarySection({ workspace, workspaceFeatures }) {
  const features = workspaceFeatures?.features || [];

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Settings size={19} />
        Workspace
      </h2>
      <div className="divider" />
      <Row label="Workspace Name" value={workspace?.workspaceName} />
      <Row label="Workspace Code" value={workspace?.workspaceCode} />
      <Row label="Language" value={workspace?.language} />
      <Row label="Currency" value={workspace?.currency} />
      <Row label="Timezone" value={workspace?.timezone} />
      <Row label="Measurement System" value={workspace?.measurementSystem} />

      <div className="divider" />
      <h2 style={{ fontSize: 14, marginBottom: 8 }}>
        Enabled Features ({workspaceFeatures?.count ?? 0})
      </h2>
      {features.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No optional features enabled.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {features.map((f) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={15} />
              <span>{f.name}</span>
              {f.category && (
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                  ({f.category})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
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
