import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ClipboardList,
  Factory,
  Gauge,
  Layers3,
  Package,
  Search,
  Settings,
  Shirt,
  ShoppingCart,
  Sparkles,
  TableProperties,
  Users,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";

const MODULE_GROUPS = [
  {
    id: "industrial-engineering",
    title: "Industrial Engineering",
    description: "Core engineering tools for time, capacity and performance analysis.",
    icon: Gauge,
    modules: [
      { id: "smv", name: "SMV", description: "Standard minute value and operation breakdown.", recommended: true },
      { id: "capacity-planning", name: "Capacity Planning", description: "Plan line, department and factory output.", recommended: true },
      { id: "efficiency", name: "Efficiency", description: "Measure operator, line and department efficiency.", recommended: true },
      { id: "bottleneck-analysis", name: "Bottleneck Analysis", description: "Identify process constraints and balancing gaps.", recommended: true },
    ],
  },
  {
    id: "fabric",
    title: "Fabric Engineering",
    description: "Manage fabric masters, consumption, BOM and requirements.",
    icon: Layers3,
    modules: [
      { id: "fabric-master", name: "Fabric Master", description: "Maintain approved fabric specifications and codes.", recommended: true },
      { id: "fabric-bom", name: "Fabric BOM", description: "Create style-wise fabric consumption and cost structures.", recommended: true },
      { id: "fabric-requirement", name: "Fabric Requirement", description: "Generate gross, stock and need-to-buy requirements.", recommended: true },
    ],
  },
  {
    id: "thread",
    title: "Thread Engineering",
    description: "Control thread masters, consumption and requirement planning.",
    icon: Wrench,
    modules: [
      { id: "thread-master", name: "Thread Master", description: "Maintain thread codes, types, prices and specifications.", recommended: true },
      { id: "thread-engineering", name: "Thread Engineering", description: "Calculate operation-wise needle, looper and cover consumption.", recommended: true },
      { id: "thread-requirement", name: "Thread Requirement", description: "Generate color-wise and code-wise thread requirements.", recommended: true },
    ],
  },
  {
    id: "accessories",
    title: "Accessories Engineering",
    description: "Plan accessories consumption, costs and requirements.",
    icon: Package,
    modules: [
      { id: "accessories-master", name: "Accessories Master", description: "Maintain trims and accessories master data." },
      { id: "accessories-engineering", name: "Accessories Engineering", description: "Define style-wise usage and costing." },
      { id: "accessories-requirement", name: "Accessories Requirement", description: "Generate order-wise purchasing requirements." },
    ],
  },
  {
    id: "merchandising",
    title: "Merchandising",
    description: "Connect style data, orders and garment costing.",
    icon: Shirt,
    modules: [
      { id: "style-master", name: "Style Master", description: "Centralize article, color, size and engineering links.", recommended: true },
      { id: "export-orders", name: "Export Orders", description: "Create EO and PO structures with color and size breakdown.", recommended: true },
      { id: "costing", name: "Garment Costing", description: "Combine fabric, thread, accessories, SMV and overhead costs.", recommended: true },
    ],
  },
  {
    id: "inventory",
    title: "Inventory & Procurement",
    description: "Track suppliers, purchase activity, stock and reservations.",
    icon: Warehouse,
    modules: [
      { id: "supplier-master", name: "Supplier Master", description: "Maintain approved supplier and vendor records." },
      { id: "purchase", name: "Purchase", description: "Manage purchase requests, orders and incoming supply." },
      { id: "inventory", name: "Inventory", description: "Track available, reserved, incoming and issued stock." },
    ],
  },
  {
    id: "production",
    title: "Production",
    description: "Monitor manufacturing execution by department.",
    icon: Factory,
    modules: [
      { id: "cutting", name: "Cutting", description: "Plan cutting, marker, lays, bundles and output." },
      { id: "stitching", name: "Stitching", description: "Track sewing line plans, WIP and performance." },
      { id: "finishing", name: "Finishing", description: "Manage finishing capacity, output and quality." },
      { id: "packing", name: "Packing", description: "Manage packing plans, cartonization and dispatch readiness." },
    ],
  },
  {
    id: "management",
    title: "Management & Administration",
    description: "Platform-wide visibility, controls and reporting.",
    icon: Settings,
    modules: [
      { id: "dashboard", name: "Dashboard", description: "Executive KPIs and workspace-level visibility.", recommended: true },
      { id: "reports", name: "Reports", description: "Standard and customizable operational reports.", recommended: true },
      { id: "user-management", name: "User Management", description: "Create users and manage workspace access.", recommended: true },
      { id: "role-management", name: "Roles & Permissions", description: "Control module-level and action-level permissions.", recommended: true },
    ],
  },
];

const DEFAULT_SELECTED = MODULE_GROUPS.flatMap((group) =>
  group.modules.filter((module) => module.recommended).map((module) => module.id)
);

export default function ModuleStep({
  initialModules = DEFAULT_SELECTED,
  onPrevious,
  onNext,
}) {
  const [selectedModules, setSelectedModules] = useState(initialModules);
  const [searchTerm, setSearchTerm] = useState("");

  const allModules = useMemo(
    () => MODULE_GROUPS.flatMap((group) => group.modules),
    []
  );

  const selectedModuleObjects = useMemo(
    () => allModules.filter((module) => selectedModules.includes(module.id)),
    [allModules, selectedModules]
  );

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return MODULE_GROUPS;

    return MODULE_GROUPS.map((group) => ({
      ...group,
      modules: group.modules.filter(
        (module) =>
          module.name.toLowerCase().includes(query) ||
          module.description.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query)
      ),
    })).filter((group) => group.modules.length > 0);
  }, [searchTerm]);

  const toggleModule = (moduleId) => {
    setSelectedModules((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId]
    );
  };

  const selectGroup = (group) => {
    const groupIds = group.modules.map((module) => module.id);
    const allSelected = groupIds.every((id) => selectedModules.includes(id));

    setSelectedModules((current) =>
      allSelected
        ? current.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...current, ...groupIds]))
    );
  };

  const selectRecommended = () => {
    setSelectedModules(DEFAULT_SELECTED);
  };

  const selectAll = () => {
    setSelectedModules(allModules.map((module) => module.id));
  };

  const clearAll = () => {
    setSelectedModules([]);
  };

  const handleNext = () => {
    if (selectedModules.length === 0) return;

    onNext?.({
      moduleIds: selectedModules,
      modules: selectedModuleObjects.map((module) => ({
        id: module.id,
        name: module.name,
      })),
      count: selectedModules.length,
    });
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Boxes size={19} />
              Module Selection
            </h2>
            <p style={{ margin: "6px 0 0" }}>
              Choose which TextileIE modules will be enabled for this workspace.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-secondary" onClick={selectRecommended}>
              <Sparkles size={15} />
              Recommended
            </button>

            <button type="button" className="btn btn-secondary" onClick={selectAll}>
              <Check size={15} />
              Select All
            </button>

            <button type="button" className="btn btn-secondary" onClick={clearAll}>
              <X size={15} />
              Clear
            </button>
          </div>
        </div>

        <div className="divider"></div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Search Modules</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Search size={17} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search SMV, fabric, inventory, reports..."
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 20,
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const selectedCount = group.modules.filter((module) =>
              selectedModules.includes(module.id)
            ).length;
            const allSelected =
              selectedCount === group.modules.length && group.modules.length > 0;

            return (
              <div className="card" key={group.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        background: "var(--bg)",
                      }}
                    >
                      <GroupIcon size={19} />
                    </div>

                    <div>
                      <h2 style={{ marginBottom: 4 }}>{group.title}</h2>
                      <p style={{ margin: 0 }}>{group.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={allSelected ? "btn btn-primary" : "btn btn-secondary"}
                    onClick={() => selectGroup(group)}
                  >
                    {allSelected ? "Remove Group" : "Select Group"}
                  </button>
                </div>

                <div className="divider"></div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                  }}
                >
                  {group.modules.map((module) => {
                    const selected = selectedModules.includes(module.id);

                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        style={{
                          textAlign: "left",
                          padding: 14,
                          borderRadius: 10,
                          cursor: "pointer",
                          border: selected
                            ? "2px solid var(--teal)"
                            : "1px solid var(--border)",
                          background: "var(--surface)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <strong>{module.name}</strong>
                            {module.recommended && (
                              <div
                                style={{
                                  marginTop: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--teal)",
                                }}
                              >
                                RECOMMENDED
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 7,
                              display: "grid",
                              placeItems: "center",
                              background: selected ? "var(--teal)" : "var(--bg)",
                              color: selected ? "#fff" : "var(--text-primary)",
                            }}
                          >
                            {selected && <Check size={15} />}
                          </div>
                        </div>

                        <p style={{ margin: "10px 0 0" }}>{module.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 30 }}>
              <Search size={24} />
              <h2 style={{ marginTop: 10 }}>No modules found</h2>
              <p>Try another search term.</p>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ position: "sticky", top: 20 }}>
            <h2>Selection Summary</h2>
            <div className="divider"></div>

            <SummaryRow label="Selected Modules" value={selectedModules.length} />
            <SummaryRow label="Available Modules" value={allModules.length} />
            <SummaryRow
              label="Coverage"
              value={`${Math.round(
                (selectedModules.length / allModules.length) * 100
              )}%`}
            />

            <div className="divider"></div>

            <div style={{ display: "grid", gap: 8, maxHeight: 420, overflowY: "auto" }}>
              {selectedModuleObjects.length === 0 ? (
                <p>No modules selected.</p>
              ) : (
                selectedModuleObjects.map((module) => (
                  <div
                    key={module.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    <span>{module.name}</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => toggleModule(module.id)}
                      aria-label={`Remove ${module.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {selectedModules.length === 0 && (
              <>
                <div className="divider"></div>
                <p style={{ color: "var(--red)" }}>
                  Select at least one module before continuing.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onPrevious}
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={selectedModules.length === 0}
        >
          Continue to Workspace Features
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
