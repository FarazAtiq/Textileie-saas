import { useMemo } from "react";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import OnboardingProgress from "./components/OnboardingProgress.jsx";
import CompanySummarySection from "./sections/CompanySummarySection.jsx";
import OwnerSummarySection from "./sections/OwnerSummarySection.jsx";
import SubscriptionSummarySection from "./sections/SubscriptionSummarySection.jsx";
import ModulesSummarySection from "./sections/ModulesSummarySection.jsx";
import WorkspaceSummarySection from "./sections/WorkspaceSummarySection.jsx";
import PricingBreakdownSection from "./sections/PricingBreakdownSection.jsx";
import { calculateBillingSummary } from "./utils/billingCalculations.js";

export default function BillingSummaryStep({
  company,
  owner,
  subscription,
  modules,
  workspace,
  workspaceFeatures,
  onPrevious,
  onNext,
}) {
  const billing = useMemo(
    () =>
      calculateBillingSummary({
        subscription,
        workspaceFeatures,
      }),
    [subscription, workspaceFeatures]
  );

  const canContinue = Boolean(subscription && modules?.count);

  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Customer Provisioning Wizard</h1>
          <p>
            Review your workspace configuration and billing estimate before
            factory setup.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <OnboardingProgress />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 20 }}>
          <CompanySummarySection company={company} />
          <OwnerSummarySection owner={owner} />
          <SubscriptionSummarySection
            subscription={subscription}
            billing={billing}
          />
          <ModulesSummarySection modules={modules} />
          <WorkspaceSummarySection
            workspace={workspace}
            workspaceFeatures={workspaceFeatures}
          />
        </div>

        <div style={{ position: "sticky", top: 20 }}>
          <PricingBreakdownSection
            subscription={subscription}
            billing={billing}
          />

          <div className="card" style={{ marginTop: 20 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={19} />
              Ready to Continue
            </h2>
            <div className="divider" />
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Confirm the selections above. The next step will configure your
              first manufacturing factory for this workspace.
            </p>
            {!canContinue && (
              <p style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>
                Subscription and at least one module are required to continue.
              </p>
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
        <button type="button" className="btn btn-secondary" onClick={onPrevious}>
          <ArrowLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!canContinue}
        >
          Continue to Factory Setup
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

