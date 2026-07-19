import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bot,
  Braces,
  Check,
  Database,
  FileClock,
  Link2,
  Mail,
  MessageCircle,
  Plug,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Webhook,
  X,
} from "lucide-react";

const FEATURES = [
  {
    id: "email-notifications",
    name: "Email Notifications",
    description: "Send workflow alerts, approvals, reminders and reports by email.",
    icon: Mail,
    category: "Communication",
    defaultEnabled: true,
  },
  {
    id: "whatsapp-notifications",
    name: "WhatsApp Notifications",
    description: "Send important operational updates through connected WhatsApp services.",
    icon: MessageCircle,
    category: "Communication",
    defaultEnabled: false,
  },
  {
    id: "sms-notifications",
    name: "SMS Notifications",
    description: "Send short critical alerts to approved mobile numbers.",
    icon: Smartphone,
    category: "Communication",
    defaultEnabled: false,
  },
  {
    id: "in-app-notifications",
    name: "In-App Notifications",
    description: "Show real-time alerts and action items inside TextileIE.",
    icon: Bell,
    category: "Communication",
    defaultEnabled: true,
  },
  {
    id: "ai-recommendations",
    name: "AI Recommendations",
    description: "Generate engineering insights, exceptions and operational suggestions.",
    icon: Bot,
    category: "Intelligence",
    defaultEnabled: true,
  },
  {
    id: "ai-assistant",
    name: "Workspace AI Assistant",
    description: "Allow authorized users to ask questions across approved workspace data.",
    icon: Sparkles,
    category: "Intelligence",
    defaultEnabled: false,
  },
  {
    id: "api-access",
    name: "API Access",
    description: "Enable secure API access for approved external systems.",
    icon: Braces,
    category: "Integrations",
    defaultEnabled: false,
  },
  {
    id: "erp-integration",
    name: "ERP Integration",
    description: "Connect TextileIE with factory ERP systems for master and transaction data.",
    icon: Plug,
    category: "Integrations",
    defaultEnabled: false,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Send approved event notifications to external applications.",
    icon: Webhook,
    category: "Integrations",
    defaultEnabled: false,
  },
  {
    id: "ghl-integration",
    name: "GoHighLevel Integration",
    description: "Connect selected customer, communication and workflow automations.",
    icon: Link2,
    category: "Integrations",
    defaultEnabled: false,
  },
  {
    id: "audit-logs",
    name: "Audit Logs",
    description: "Record important create, edit, approval and deletion activities.",
    icon: FileClock,
    category: "Governance",
    defaultEnabled: true,
    locked: true,
  },
  {
    id: "activity-tracking",
    name: "Activity Tracking",
    description: "Track user actions and recent workspace activity.",
    icon: Activity,
    category: "Governance",
    defaultEnabled: true,
  },
  {
    id: "role-security",
    name: "Role-Based Security",
    description: "Restrict modules and actions according to assigned roles.",
    icon: ShieldCheck,
    category: "Governance",
    defaultEnabled: true,
    locked: true,
  },
  {
    id: "data-backup",
    name: "Workspace Data Backup",
    description: "Enable scheduled backup policies for supported workspace data.",
    icon: Database,
    category: "Governance",
    defaultEnabled: true,
  },
];

const DEFAULT_ENABLED = FEATURES.filter((feature) => feature.defaultEnabled).map(
  (feature) => feature.id
);

export default function WorkspaceFeaturesStep({
  initialFeatures = DEFAULT_ENABLED,
  onPrevious,
  onNext,
}) {
  const lockedFeatures = FEATURES.filter((feature) => feature.locked).map(
    (feature) => feature.id
  );

  const [enabledFeatures, setEnabledFeatures] = useState(() =>
    Array.from(new Set([...initialFeatures, ...lockedFeatures]))
  );

  const groupedFeatures = useMemo(() => {
    return FEATURES.reduce((groups, feature) => {
      if (!groups[feature.category]) {
        groups[feature.category] = [];
      }

      groups[feature.category].push(feature);
      return groups;
    }, {});
  }, []);

  const enabledFeatureObjects = useMemo(
    () => FEATURES.filter((feature) => enabledFeatures.includes(feature.id)),
    [enabledFeatures]
  );

  const toggleFeature = (feature) => {
    if (feature.locked) return;

    setEnabledFeatures((current) =>
      current.includes(feature.id)
        ? current.filter((id) => id !== feature.id)
        : [...current, feature.id]
    );
  };

  const enableRecommended = () => {
    setEnabledFeatures(DEFAULT_ENABLED);
  };

  const enableAll = () => {
    setEnabledFeatures(FEATURES.map((feature) => feature.id));
  };

  const clearOptional = () => {
    setEnabledFeatures(lockedFeatures);
  };

  const handleNext = () => {
    onNext?.({
      featureIds: enabledFeatures,
      features: enabledFeatureObjects.map((feature) => ({
        id: feature.id,
        name: feature.name,
        category: feature.category,
      })),
      count: enabledFeatures.length,
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
              <ShieldCheck size={19} />
              Workspace Features
            </h2>
            <p style={{ margin: "6px 0 0" }}>
              Configure notifications, intelligence, integrations and governance controls.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={enableRecommended}
            >
              <Sparkles size={15} />
              Recommended
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={enableAll}
            >
              <Check size={15} />
              Enable All
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearOptional}
            >
              <X size={15} />
              Clear Optional
            </button>
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
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div className="card" key={category}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2>{category}</h2>
                  <p style={{ margin: "5px 0 0" }}>
                    {category === "Communication" &&
                      "Choose how workspace alerts and reminders are delivered."}
                    {category === "Intelligence" &&
                      "Enable AI-powered assistance and operational recommendations."}
                    {category === "Integrations" &&
                      "Connect TextileIE with approved external systems."}
                    {category === "Governance" &&
                      "Apply security, traceability and data-protection controls."}
                  </p>
                </div>

                <strong>
                  {
                    features.filter((feature) =>
                      enabledFeatures.includes(feature.id)
                    ).length
                  }
                  /{features.length} enabled
                </strong>
              </div>

              <div className="divider"></div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {features.map((feature) => {
                  const Icon = feature.icon;
                  const enabled = enabledFeatures.includes(feature.id);

                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      disabled={feature.locked}
                      style={{
                        textAlign: "left",
                        padding: 15,
                        borderRadius: 10,
                        cursor: feature.locked ? "not-allowed" : "pointer",
                        opacity: feature.locked ? 0.9 : 1,
                        border: enabled
                          ? "2px solid var(--teal)"
                          : "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 9,
                              display: "grid",
                              placeItems: "center",
                              background: enabled ? "var(--teal)" : "var(--bg)",
                              color: enabled ? "#fff" : "var(--text-primary)",
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={17} />
                          </div>

                          <div>
                            <strong>{feature.name}</strong>

                            {feature.locked && (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--teal)",
                                }}
                              >
                                REQUIRED
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            width: 36,
                            height: 21,
                            borderRadius: 999,
                            padding: 3,
                            background: enabled ? "var(--teal)" : "var(--border)",
                            display: "flex",
                            justifyContent: enabled ? "flex-end" : "flex-start",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 15,
                              height: 15,
                              borderRadius: "50%",
                              background: "#fff",
                            }}
                          />
                        </div>
                      </div>

                      <p style={{ margin: "11px 0 0" }}>{feature.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ position: "sticky", top: 20 }}>
            <h2>Feature Summary</h2>
            <div className="divider"></div>

            <SummaryRow label="Enabled" value={enabledFeatures.length} />
            <SummaryRow label="Available" value={FEATURES.length} />
            <SummaryRow
              label="Required Controls"
              value={lockedFeatures.length}
            />

            <div className="divider"></div>

            <div
              style={{
                display: "grid",
                gap: 8,
                maxHeight: 420,
                overflowY: "auto",
              }}
            >
              {enabledFeatureObjects.map((feature) => (
                <div
                  key={feature.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 0",
                  }}
                >
                  <div>
                    <strong>{feature.name}</strong>
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      {feature.category}
                    </div>
                  </div>

                  {feature.locked ? (
                    <ShieldCheck size={15} />
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => toggleFeature(feature)}
                      aria-label={`Disable ${feature.name}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
        >
          Continue to Billing Summary
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
