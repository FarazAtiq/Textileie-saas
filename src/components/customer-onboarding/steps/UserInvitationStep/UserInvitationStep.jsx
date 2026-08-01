import { useState } from "react";
import {
  UserPlus, Mail, Trash2, ArrowLeft, ArrowRight, ShieldCheck,
} from "lucide-react";
import StatusBadge from "../../../master/StatusBadge.jsx";
import { defaultRoles, defaultInvite } from "./userInvitationDefaults";
import { validateInvite } from "./userInvitationValidation";

export default function UserInvitationStep({
  departments,
  initialInvitations,
  onPrevious,
  onNext,
}) {
  const [invitations, setInvitations] = useState(
    initialInvitations && initialInvitations.length ? initialInvitations : []
  );

  const [draft, setDraft] = useState(defaultInvite);
  const [draftErrors, setDraftErrors] = useState({});

  const roleName = (roleId) =>
    defaultRoles.find((r) => r.id === roleId)?.name || "—";

  const addInvite = () => {
    const errors = validateInvite(draft, invitations);
    if (Object.keys(errors).length > 0) {
      setDraftErrors(errors);
      return;
    }

    setInvitations((prev) => [
      ...prev,
      { ...draft, email: draft.email.trim().toLowerCase(), status: "Pending" },
    ]);
    setDraft(defaultInvite);
    setDraftErrors({});
  };

  const removeInvite = (email) => {
    setInvitations((prev) => prev.filter((i) => i.email !== email));
  };

  const handleContinue = () => {
    onNext(invitations);
  };

  return (
    <div className="app-main">

      {/* Header */}

      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>User Invitation</h1>
          <p>
            Invite teammates to the workspace. You can skip this and invite
            people later from Settings.
          </p>
        </div>
      </div>

      {/* Progress */}

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#16a34a" }}>✓ Company</span>
          <span style={{ color: "#16a34a" }}>✓ Owner</span>
          <span style={{ color: "#16a34a" }}>✓ Workspace</span>
          <span style={{ color: "#16a34a" }}>✓ Factory</span>
          <span style={{ color: "#16a34a" }}>✓ Departments</span>
          <span style={{ color: "#2563eb" }}>● Users</span>
          <span style={{ color: "#9ca3af" }}>○ Review</span>
        </div>
      </div>

      {/* Roles reference */}

      <div className="card">
        <h2>
          <ShieldCheck size={20} />
          &nbsp; Available Roles
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {defaultRoles.map((role) => (
            <div
              key={role.id}
              style={{
                padding: 14,
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--bg)",
              }}
            >
              <strong>{role.name}</strong>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite form */}

      <div className="card">
        <h2>
          <UserPlus size={20} />
          &nbsp; Invite a Teammate
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 16,
            marginTop: 16,
            alignItems: "start",
          }}
        >
          <div>
            <label>Email *</label>
            <input
              type="email"
              className="field"
              value={draft.email}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            {draftErrors.email && (
              <p style={{ color: "#dc2626", marginTop: 4 }}>{draftErrors.email}</p>
            )}
          </div>

          <div>
            <label>Role *</label>
            <select
              className="field"
              value={draft.roleId}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, roleId: e.target.value }))
              }
            >
              <option value="">Select role</option>
              {defaultRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {draftErrors.roleId && (
              <p style={{ color: "#dc2626", marginTop: 4 }}>{draftErrors.roleId}</p>
            )}
          </div>

          <div>
            <label>Department</label>
            <select
              className="field"
              value={draft.departmentCode}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, departmentCode: e.target.value }))
              }
            >
              <option value="">Unassigned</option>
              {(departments || []).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 22 }}
            onClick={addInvite}
          >
            <Mail size={16} />
            Invite
          </button>
        </div>
      </div>

      {/* Invitation list */}

      <div className="card">
        <h2>Invitations ({invitations.length})</h2>

        {invitations.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
            No invitations yet. This step is optional — you can continue
            without inviting anyone.
          </p>
        ) : (
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "8px 4px" }}>Email</th>
                <th style={{ padding: "8px 4px" }}>Role</th>
                <th style={{ padding: "8px 4px" }}>Department</th>
                <th style={{ padding: "8px 4px" }}>Status</th>
                <th style={{ padding: "8px 4px" }}></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((i) => (
                <tr key={i.email} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 4px" }}>{i.email}</td>
                  <td style={{ padding: "8px 4px" }}>{roleName(i.roleId)}</td>
                  <td style={{ padding: "8px 4px" }}>
                    {(departments || []).find((d) => d.code === i.departmentCode)?.name ||
                      "Unassigned"}
                  </td>
                  <td style={{ padding: "8px 4px" }}>
                    <StatusBadge status="Development" />
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeInvite(i.email)}
                      title="Remove invitation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Navigation */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button type="button" className="btn btn-secondary" onClick={onPrevious}>
          <ArrowLeft size={16} />
          Previous
        </button>

        <button type="button" className="btn btn-primary" onClick={handleContinue}>
          Continue to Review
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
}
