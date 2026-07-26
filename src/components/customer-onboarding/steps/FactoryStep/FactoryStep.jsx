import { useState } from "react";
import { Building2, Save, ArrowRight } from "lucide-react";
import { defaultFactory } from "./factoryDefaults";
import { validateFactory } from "./factoryValidation";

export default function FactoryStep({
  initialFactory,
  onPrevious,
  onNext,
}) {
  const [factory, setFactory] = useState(
    initialFactory || defaultFactory
  );

  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFactory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinue = () => {
    const validation = validateFactory(factory);

    setErrors(validation);

    if (Object.keys(validation).length === 0) {
      onNext(factory);
    }
  };

  return (
    <div className="app-main">

      {/* Header */}

      <div className="module-hero">

        <div>

          <div className="eyebrow">
            Platform
          </div>

          <h1>
            Factory Setup
          </h1>

          <p>
            Configure your manufacturing facility before creating
            departments.
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

          <span style={{ color: "#16a34a" }}>
            ✓ Workspace
          </span>

          <span style={{ color: "#2563eb" }}>
            ● Factory
          </span>

          <span style={{ color: "#9ca3af" }}>
            ○ Departments
          </span>

          <span style={{ color: "#9ca3af" }}>
            ○ Users
          </span>

          <span style={{ color: "#9ca3af" }}>
            ○ Review
          </span>

        </div>

      </div>

      {/* Factory Information */}

      <div className="card">

        <h2>
          <Building2 size={20} />
          &nbsp; Factory Information
        </h2>

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
              Factory Code
            </label>

            <input
              className="field"
              value={factory.factoryCode}
              readOnly
            />

          </div>

          <div>

            <label>
              Factory Name *
            </label>

            <input
              className="field"
              value={factory.factoryName}
              onChange={(e) =>
                updateField(
                  "factoryName",
                  e.target.value
                )
              }
            />

            {errors.factoryName && (

              <p
                style={{
                  color: "#dc2626",
                  marginTop: 4,
                }}
              >
                {errors.factoryName}
              </p>

            )}

          </div>

          <div>

            <label>
              Short Name
            </label>

            <input
              className="field"
              value={factory.shortName}
              onChange={(e) =>
                updateField(
                  "shortName",
                  e.target.value
                )
              }
            />

          </div>

          <div>

            <label>
              Factory Type
            </label>

            <select
              className="field"
              value={factory.factoryType}
              onChange={(e) =>
                updateField(
                  "factoryType",
                  e.target.value
                )
              }
            >

              <option>Garment</option>

              <option>Textile</option>

              <option>Knitting</option>

              <option>Weaving</option>

              <option>Dyeing</option>

              <option>Washing</option>

              <option>Composite</option>

            </select>

          </div>

          <div>

            <label>
              Status
            </label>

            <select
              className="field"
              value={factory.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value
                )
              }
            >

              <option>Active</option>

              <option>Inactive</option>

            </select>

          </div>

        </div>

      </div>

      {/* CONTACT INFORMATION WILL BE ADDED IN PART 2 */}

    </div>
  );
}
