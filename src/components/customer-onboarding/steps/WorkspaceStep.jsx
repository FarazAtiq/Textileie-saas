import { useState } from "react";
export default function WorkspaceStep({
  companyName = "",
  initialWorkspace,
  onPrevious,
  onNext,
})

 {
  const [workspace, setWorkspace] = useState(
  initialWorkspace || {
    workspaceName: companyName
      ? `${companyName} Workspace`
      : "",
    workspaceCode: "TXT-000001",
    language: "English",
    currency: "PKR",
    timezone: "Asia/Karachi",
    dateFormat: "DD/MM/YYYY",

    measurementSystem: "Metric",
    fabricUnit: "Meter",
    weightUnit: "Kg",
    widthUnit: "Inch",

    theme: "Blue",

    emailNotification: true,
    activityLogs: true,
    auditTrail: true,
    autoBackup: true,
    darkMode: false,
    autoLogout: true,
  }
);
  const updateField = (field, value) => {
    setWorkspace((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="app-main">

      {/* Header */}

      <div className="module-hero">
        <div>
          <h1>Workspace Configuration</h1>

          <p>
            Configure your TextileIE workspace before creating factories
            and departments.
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

          <span style={{ color: "#16a34a" }}>
            ✓ Company
          </span>

          <span style={{ color: "#16a34a" }}>
            ✓ Owner
          </span>

          <span style={{ color: "#2563eb" }}>
            ● Workspace
          </span>

          <span style={{ color: "#9ca3af" }}>
            ○ Factory
          </span>

          <span style={{ color: "#9ca3af" }}>
            ○ Departments
          </span>

          <span style={{ color: "#9ca3af" }}>
            ○ Review
          </span>

        </div>

      </div>

      {/* Workspace Details */}

      <div className="card">

        <h2>Workspace Details</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >

          <div>

            <label>
              Workspace Name
            </label>

            <input
              className="field"
              type="text"
              value={workspace.workspaceName}
              onChange={(e) =>
                updateField(
                  "workspaceName",
                  e.target.value
                )
              }
            />

          </div>

          <div>

            <label>
              Workspace Code
            </label>

            <input
              className="field"
              value={workspace.workspaceCode}
              readOnly
            />

          </div>

          <div>

            <label>
              Company Logo
            </label>

            <input
              className="field"
              type="file"
            />

          </div>

          <div>

            <label>
              Language
            </label>

            <select
              className="field"
              value={workspace.language}
              onChange={(e) =>
                updateField(
                  "language",
                  e.target.value
                )
              }
            >

              <option>English</option>

              <option>Urdu</option>

            </select>

          </div>

          <div>

            <label>
              Currency
            </label>

            <select
              className="field"
              value={workspace.currency}
              onChange={(e) =>
                updateField(
                  "currency",
                  e.target.value
                )
              }
            >

              <option>PKR</option>

              <option>USD</option>

              <option>EUR</option>

              <option>SAR</option>

            </select>

          </div>

          <div>

            <label>
              Time Zone
            </label>

            <select
              className="field"
              value={workspace.timezone}
              onChange={(e) =>
                updateField(
                  "timezone",
                  e.target.value
                )
              }
            >

              <option>
                Asia/Karachi
              </option>

              <option>
                Asia/Dubai
              </option>

              <option>
                Europe/Rome
              </option>

            </select>

          </div>

          <div>

            <label>
              Date Format
            </label>

            <select
              className="field"
              value={workspace.dateFormat}
              onChange={(e) =>
                updateField(
                  "dateFormat",
                  e.target.value
                )
              }
            >

              <option>
                DD/MM/YYYY
              </option>

              <option>
                MM/DD/YYYY
              </option>

              <option>
                YYYY-MM-DD
              </option>

            </select>

          </div>

        </div>

      </div>
            {/* Engineering Defaults */}

      <div className="card">
        <h2>Engineering Defaults</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 20,
            marginTop: 20,
          }}
        >
          <OptionGroup
            label="Measurement System"
            value={workspace.measurementSystem}
            options={["Metric", "Imperial"]}
            onChange={(value) =>
              updateField("measurementSystem", value)
            }
          />

          <OptionGroup
            label="Fabric Unit"
            value={workspace.fabricUnit}
            options={["Meter", "Yard"]}
            onChange={(value) =>
              updateField("fabricUnit", value)
            }
          />

          <OptionGroup
            label="Weight Unit"
            value={workspace.weightUnit}
            options={["Kg", "Pound"]}
            onChange={(value) =>
              updateField("weightUnit", value)
            }
          />

          <OptionGroup
            label="Width Unit"
            value={workspace.widthUnit}
            options={["Inch", "Centimeter"]}
            onChange={(value) =>
              updateField("widthUnit", value)
            }
          />
        </div>
      </div>

      {/* Appearance */}

      <div className="card">
        <h2>Appearance</h2>

        <p style={{ marginTop: 6, color: "#64748b" }}>
          Select the default accent color for this workspace.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 20,
          }}
        >
          {["Blue", "Green", "Purple", "Gray"].map((theme) => {
            const selected = workspace.theme === theme;

            const themeColors = {
              Blue: "#2563eb",
              Green: "#16a34a",
              Purple: "#7c3aed",
              Gray: "#64748b",
            };

            return (
              <button
                key={theme}
                type="button"
                onClick={() => updateField("theme", theme)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 120,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: selected
                    ? `2px solid ${themeColors[theme]}`
                    : "1px solid #dbe2ea",
                  background: selected ? "#f8fafc" : "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: themeColors[theme],
                    display: "inline-block",
                  }}
                />

                {theme}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Options */}

      <div className="card">
        <h2>Workspace Options</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 14,
            marginTop: 20,
          }}
        >
          <ToggleOption
            label="Email Notifications"
            description="Send important account and workflow notifications by email."
            checked={workspace.emailNotification}
            onChange={(checked) =>
              updateField("emailNotification", checked)
            }
          />

          <ToggleOption
            label="Activity Logs"
            description="Record important user actions inside the workspace."
            checked={workspace.activityLogs}
            onChange={(checked) =>
              updateField("activityLogs", checked)
            }
          />

          <ToggleOption
            label="Audit Trail"
            description="Maintain detailed history for sensitive business records."
            checked={workspace.auditTrail}
            onChange={(checked) =>
              updateField("auditTrail", checked)
            }
          />

          <ToggleOption
            label="Auto Backup"
            description="Prepare workspace data for scheduled backup workflows."
            checked={workspace.autoBackup}
            onChange={(checked) =>
              updateField("autoBackup", checked)
            }
          />

          <ToggleOption
            label="Dark Mode"
            description="Use dark appearance as the default workspace display."
            checked={workspace.darkMode}
            onChange={(checked) =>
              updateField("darkMode", checked)
            }
          />

          <ToggleOption
            label="Auto Logout"
            description="Automatically sign out inactive users for security."
            checked={workspace.autoLogout}
            onChange={(checked) =>
              updateField("autoLogout", checked)
            }
          />
        </div>
      </div>
            {/* Workspace Summary */}

      <div className="card">
        <h2>Workspace Summary</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          <SummaryItem label="Workspace" value={workspace.workspaceName || "-"} />
          <SummaryItem label="Company" value={companyName || "-"} />
          <SummaryItem label="Language" value={workspace.language} />
          <SummaryItem label="Currency" value={workspace.currency} />
          <SummaryItem label="Time Zone" value={workspace.timezone} />
          <SummaryItem label="Measurement" value={workspace.measurementSystem} />
          <SummaryItem label="Fabric Unit" value={workspace.fabricUnit} />
          <SummaryItem label="Weight Unit" value={workspace.weightUnit} />
          <SummaryItem label="Width Unit" value={workspace.widthUnit} />
          <SummaryItem label="Theme" value={workspace.theme} />
        </div>
      </div>

      {/* Navigation */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 24,
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={onPrevious}
        >
          Previous
        </button>

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          <button
            className="btn btn-secondary"
            type="button"
          >
            Save Draft
          </button>

          <button
            className="btn btn-primary"
            onClick={() => onNext(workspace)}
            disabled={!workspace.workspaceName.trim()}
          >
            Continue to Factory Setup
          </button>
        </div>
      </div>

    </div>
  );
}

/* ---------- Helper Components ---------- */

function SummaryItem({ label, value }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function OptionGroup({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <div>
      <div
        style={{
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      {options.map((option) => (
        <label
          key={option}
          style={{
            display: "block",
            marginBottom: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            checked={value === option}
            onChange={() => onChange(option)}
            style={{ marginRight: 8 }}
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 14,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      <div>
        <div
          style={{
            fontWeight: 600,
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: "#64748b",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {description}
        </div>
      </div>
    </label>
  );
}
