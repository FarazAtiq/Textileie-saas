import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Building2, Factory, Layers, Users, LayoutGrid, ArrowRight,
} from "lucide-react";

export default function WelcomeStep({
  company,
  factory,
  departments,
  modules,
  invitations,
  bootstrapResult,
}) {
  const navigate = useNavigate();

  const stats = [
    { icon: Building2, label: "Company", value: company?.companyName || "—" },
    { icon: Factory, label: "Factory", value: factory?.factoryName || "—" },
    { icon: Layers, label: "Departments", value: departments?.length || 0 },
    { icon: LayoutGrid, label: "Modules Enabled", value: modules?.count ?? 0 },
    { icon: Users, label: "Invitations Sent", value: invitations?.length || 0 },
  ];

  return (
    <div className="app-main">

      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={28} color="#16a34a" />
            Welcome to TextileIE
          </h1>
          <p>
            Your workspace{company?.companyName ? ` for ${company.companyName}` : ""}{" "}
            is ready to go.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
        }}
      >
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card" style={{ textAlign: "center" }}>
            <Icon size={22} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>What's Next</h2>
        <div className="divider" />
        <div style={{ display: "grid", gap: 12 }}>
          <NextStep
            title="Explore your Dashboard"
            description="See a live overview of your factory once you start entering data."
            action={() => navigate("/dashboard")}
            actionLabel="Go to Dashboard"
          />
          <NextStep
            title="Set up your first Style"
            description="Add a style, its BOM, and cost breakdown to start tracking production."
            action={() => navigate("/styles")}
            actionLabel="Open Styles"
          />
          <NextStep
            title="Invite more teammates"
            description="Add anyone you didn't invite during setup from Settings."
            action={() => navigate("/settings")}
            actionLabel="Open Settings"
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-full"
        style={{ marginTop: 20 }}
        onClick={() => navigate("/dashboard")}
      >
        Continue to Dashboard
        <ArrowRight size={16} />
      </button>

    </div>
  );
}

function NextStep({ title, description, action, actionLabel }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <strong>{title}</strong>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
          {description}
        </p>
      </div>
      <button type="button" className="btn btn-secondary" onClick={action}>
        {actionLabel}
      </button>
    </div>
  );
        }
