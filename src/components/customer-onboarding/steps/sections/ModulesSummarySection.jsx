import { LayoutGrid, Check } from "lucide-react";

export default function ModulesSummarySection({ modules }) {
  const list = modules?.modules || [];

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LayoutGrid size={19} />
        Modules ({modules?.count ?? 0})
      </h2>
      <div className="divider" />
      {list.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No modules selected.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {list.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={15} />
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
