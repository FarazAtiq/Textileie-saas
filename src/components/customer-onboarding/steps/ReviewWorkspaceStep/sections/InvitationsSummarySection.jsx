import { Mail } from "lucide-react";
import { defaultRoles } from "../../UserInvitationStep/userInvitationDefaults";

export default function InvitationsSummarySection({ invitations, departments }) {
  const list = invitations || [];

  const roleName = (roleId) =>
    defaultRoles.find((r) => r.id === roleId)?.name || "—";

  const departmentName = (code) =>
    (departments || []).find((d) => d.code === code)?.name || "Unassigned";

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Mail size={19} />
        Invitations ({list.length})
      </h2>
      <div className="divider" />
      {list.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>
          No teammates invited yet. You can invite people later from Settings.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((i) => (
            <div key={i.email} style={{ fontSize: 13 }}>
              <strong>{i.email}</strong>
              <div style={{ color: "var(--text-secondary)" }}>
                {roleName(i.roleId)} · {departmentName(i.departmentCode)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
