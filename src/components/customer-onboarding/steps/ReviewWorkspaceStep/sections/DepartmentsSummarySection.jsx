import { Layers, Check } from "lucide-react";

export default function DepartmentsSummarySection({ departments }) {
  const list = departments || [];

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Layers size={19} />
        Departments ({list.length})
      </h2>
      <div className="divider" />
      {list.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No departments added.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {list.map((d) => (
            <div key={d.code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={15} />
              <span>{d.name}</span>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                ({d.type})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
