import { useState } from "react";
import {
  Building2, MapPin, Users, ArrowLeft, ArrowRight,
} from "lucide-react";
import SearchSelect from "../../../common/SearchSelect.jsx";
import { defaultFactory } from "./factoryDefaults";
import { validateFactory } from "./factoryValidation";

export default function FactoryStep({
  initialFactory,
  onPrevious,
  onNext,
  countryOptions = [],
  currencyOptions = [],
  timezoneOptions = [],
  masterDataLoading = false,
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

      {/* Contact & Address */}

      <div className="card">

        <h2>
          <MapPin size={20} />
          &nbsp; Contact &amp; Address
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
            <label>Contact Person</label>
            <input
              className="field"
              value={factory.contactPerson}
              onChange={(e) => updateField("contactPerson", e.target.value)}
            />
          </div>

          <div>
            <label>Phone</label>
            <input
              className="field"
              value={factory.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div>
            <label>Mobile</label>
            <input
              className="field"
              value={factory.mobile}
              onChange={(e) => updateField("mobile", e.target.value)}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              className="field"
              value={factory.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          <div>
            <label>Website</label>
            <input
              className="field"
              value={factory.website}
              onChange={(e) => updateField("website", e.target.value)}
            />
          </div>

          <div>
            <SearchSelect
              label="Country *"
              required
              placeholder="Search countries…"
              options={countryOptions}
              value={factory.country}
              loading={masterDataLoading}
              onChange={(v) => updateField("country", v || "")}
            />
            {errors.country && (
              <p style={{ color: "#dc2626", marginTop: 4 }}>{errors.country}</p>
            )}
          </div>

          <div>
            <label>Province</label>
            <input
              className="field"
              value={factory.province}
              onChange={(e) => updateField("province", e.target.value)}
            />
          </div>

          <div>
            <label>City *</label>
            <input
              className="field"
              value={factory.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
            {errors.city && (
              <p style={{ color: "#dc2626", marginTop: 4 }}>{errors.city}</p>
            )}
          </div>

          <div>
            <label>Postal Code</label>
            <input
              className="field"
              value={factory.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
            />
          </div>

          <div>
            <SearchSelect
              label="Timezone"
              placeholder="Search timezones…"
              options={timezoneOptions}
              value={factory.timezone}
              loading={masterDataLoading}
              onChange={(v) => updateField("timezone", v || "")}
            />
          </div>

          <div>
            <SearchSelect
              label="Currency"
              placeholder="Search currencies…"
              options={currencyOptions}
              value={factory.currency}
              loading={masterDataLoading}
              onChange={(v) => updateField("currency", v || "")}
            />
          </div>

          <div>
            <label>Financial Year Start</label>
            <select
              className="field"
              value={factory.financialYear}
              onChange={(e) => updateField("financialYear", e.target.value)}
            >
              <option>January</option>
              <option>April</option>
              <option>July</option>
              <option>October</option>
            </select>
          </div>

        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Complete Address</label>
          <textarea
            rows={3}
            value={factory.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </div>

      </div>

      {/* Working Hours & Production Capacity */}

      <div className="card">

        <h2>
          <Users size={20} />
          &nbsp; Working Hours &amp; Production Capacity
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
            <label>Working Days / Week</label>
            <input
              type="number"
              min={1}
              max={7}
              className="field"
              value={factory.workingDays}
              onChange={(e) => updateField("workingDays", e.target.value)}
            />
          </div>

          <div>
            <label>Weekly Off</label>
            <select
              className="field"
              value={factory.weeklyOff}
              onChange={(e) => updateField("weeklyOff", e.target.value)}
            >
              <option>Sunday</option>
              <option>Monday</option>
              <option>Friday</option>
              <option>Saturday</option>
            </select>
          </div>

          <div>
            <label>Total Employees</label>
            <input
              type="number"
              min={0}
              className="field"
              value={factory.totalEmployees}
              onChange={(e) => updateField("totalEmployees", e.target.value)}
            />
          </div>

          <div>
            <label>Total Floors</label>
            <input
              type="number"
              min={0}
              className="field"
              value={factory.totalFloors}
              onChange={(e) => updateField("totalFloors", e.target.value)}
            />
          </div>

          <div>
            <label>Production Lines</label>
            <input
              type="number"
              min={0}
              className="field"
              value={factory.productionLines}
              onChange={(e) => updateField("productionLines", e.target.value)}
            />
          </div>

          <div>
            <label>Cutting Tables</label>
            <input
              type="number"
              min={0}
              className="field"
              value={factory.cuttingTables}
              onChange={(e) => updateField("cuttingTables", e.target.value)}
            />
          </div>

          <div>
            <label>Sewing Machines</label>
            <input
              type="number"
              min={0}
              className="field"
              value={factory.sewingMachines}
              onChange={(e) => updateField("sewingMachines", e.target.value)}
            />
          </div>

          <div>
            <label>Finishing Lines</label>
            <input
              type="number"
              min={0}
              className="field"
              value={factory.finishingLines}
              onChange={(e) => updateField("finishingLines", e.target.value)}
            />
          </div>

        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Notes</label>
          <textarea
            rows={3}
            value={factory.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </div>

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

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleContinue}
        >
          Continue to Departments
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
          }
