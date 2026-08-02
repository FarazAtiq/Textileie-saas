import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import CompanySummarySection from "../sections/CompanySummarySection.jsx";
import OwnerSummarySection from "../sections/OwnerSummarySection.jsx";
import SubscriptionSummarySection from "../sections/SubscriptionSummarySection.jsx";
import ModulesSummarySection from "../sections/ModulesSummarySection.jsx";
import WorkspaceSummarySection from "../sections/WorkspaceSummarySection.jsx";
import FactorySummarySection from "./sections/FactorySummarySection.jsx";
import DepartmentsSummarySection from "./sections/DepartmentsSummarySection.jsx";
import InvitationsSummarySection from "./sections/InvitationsSummarySection.jsx";
import { calculateBillingSummary } from "../utils/billingCalculations.js";

export default function ReviewWorkspaceStep({
  company,
  owner,
  subscription,
  modules,
  workspace,
  workspaceFeatures,
  factory,
  departments,
  invitations,
  onPrevious,
  onNext,
}) {
  const billing = calculateBillingSummary({ subscription, workspaceFeatures });

  return (
    <div className="app-main">

      {/* Header */}

      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Review Workspace</h1>
          <p>
            Confirm everything below before we create your TextileIE
            workspace.
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
          <span style={{ color: "#16a34a" }}>✓ Users</span>
          <span style={{ color: "#2563eb" }}>● Review</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 20,
        }}
      >
        <CompanySummarySection company={company} />
        <OwnerSummarySection owner={owner} />
        <SubscriptionSummarySection subscription={subscription} billing={billing} />
        <ModulesSummarySection modules={modules} />
        <WorkspaceSummarySection workspace={workspace} workspaceFeatures={workspaceFeatures} />
        <FactorySummarySection factory={factory} />
        <DepartmentsSummarySection departments={departments} />
        <InvitationsSummarySection invitations={invitations} departments={departments} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardCheck size={19} />
          Ready to Create Workspace
        </h2>
        <div className="divider" />
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Once confirmed, this configuration will be written to your
          TextileIE workspace and your account will be created.
        </p>
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

        <button type="button" className="btn btn-primary" onClick={onNext}>
          Create Workspace
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  );
}
