import { useState } from "react";
import {
  Layers, Plus, Trash2, ArrowLeft, ArrowRight, Factory,
} from "lucide-react";
import StatusBadge from "../../../master/StatusBadge.jsx";
import {
  defaultDepartment,
  departmentTypes,
  departmentPresets,
  nextDepartmentCode,
} from "./departmentDefaults";
import {
  validateDepartments,
  validateNewDepartment,
} from "./departmentValidation";

export default function DepartmentStep({
  factory,
  initialDepartments,
  onPrevious,
  onNext,
}) {
  const [departments, setDepartments] = useState(
    initialDepartments && initialDepartments.length
      ? initialDepartments
      : []
  );

  const [draft, setDraft] = useState(defaultDepartment);
  const [draftErrors, setDraftErrors] = useState({});
  const [listError, setListError] = useState(null);

  const addDepartment = (department) => {
    const errors = validateNewDepartment(department, departments);
    if (Object.keys(errors).length > 0) {
      setDraftErrors(errors);
      return;
    }

    const withCode = {
      ...department,
      code: nextDepartmentCode(departments),
      status: "Active",
    };

    setDepartments((prev) => [...prev, withCode]);
    setDraft(defaultDepartment);
    setDraftErrors({});
    setListError(null);
  };

  const addPreset = (preset) => {
    const alreadyAdded = departments.some(
      (d) => d.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (alreadyAdded) return;
    addDepartment({ ...defaultDepartment, ...preset });
  };

  const removeDepartment = (code) => {
    setDepartments((prev) => prev.filter((d) => d.code !== code));
  };

  const handleContinue = () => {
    const errors = validateDepartments(departments);
    if (errors.list) {
      setListError(errors.list);
      return;
    }
    onNext(departments);
  };

  return (
    <div className="app-main">

      {/* Header */}

      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Department Setup</h1>
          <p>
            Create the departments that will operate inside{" "}
            {factory?.factoryName || "this factory"}.
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
          <span style={{ color: "#2563eb" }}>● Departments</span>
          <span style={{ color: "#9ca3af" }}>○ Users</span>
          <span style={{ color: "#9ca3af" }}>○ Review</span>
        </div>
      </div>

      {/* Factory context */}

      {factory?.factoryName && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Factory size={18} />
          <span>
            Factory: <strong>{factory.factoryName}</strong>
            {factory.factoryCode ? ` (${factory.factoryCode})` : ""}
          </span>
        </div>
      )}

      {/* Quick add presets */}

      <div className="card">
        <h2>
          <Layers size={20} />
          &nbsp; Quick Add
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
          Tap a common department to add it instantly. You can edit or remove it below.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 16,
          }}
        >
          {departmentPresets.map((preset) => {
            const added = departments.some(
              (d) => d.name.toLowerCase() === preset.name.toLowerCase()
            );
            return (
              <button
                key={preset.name}
                type="button"
                className="btn btn-secondary"
                disabled={added}
                onClick={() => addPreset(preset)}
                style={{ opacity: added ? 0.5 : 1 }}
              >
                <Plus size={14} />
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom department */}

      <div className="card">
        <h2>Add Custom Department</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr auto",
            gap: 16,
            marginTop: 16,
            alignItems: "start",
          }}
        >
          <div>
            <label>Department Name *</label>
            <input
              className="field"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            {draftErrors.name && (
              <p style={{ color: "#dc2626", marginTop: 4 }}>{draftErrors.name}</p>
            )}
          </div>

          <div>
            <label>Type</label>
            <select
              className="field"
              value={draft.type}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              {departmentTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 22 }}
            onClick={() => addDepartment(draft)}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Department list */}

      <div className="card">
        <h2>Departments ({departments.length})</h2>

        {listError && (
          <p style={{ color: "#dc2626", marginTop: 8 }}>{listError}</p>
        )}

        {departments.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
            No departments added yet. Use Quick Add or the custom form above.
          </p>
        ) : (
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "8px 4px" }}>Code</th>
                <th style={{ padding: "8px 4px" }}>Name</th>
                <th style={{ padding: "8px 4px" }}>Type</th>
                <th style={{ padding: "8px 4px" }}>Status</th>
                <th style={{ padding: "8px 4px" }}></th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.code} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 4px" }}>{d.code}</td>
                  <td style={{ padding: "8px 4px" }}>{d.name}</td>
                  <td style={{ padding: "8px 4px" }}>{d.type}</td>
                  <td style={{ padding: "8px 4px" }}>
                    <StatusBadge status={d.status} />
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeDepartment(d.code)}
                      title="Remove department"
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
          Continue to Users
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
}
