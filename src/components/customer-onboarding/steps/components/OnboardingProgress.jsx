const STEPS = [
  "Company",
  "Owner",
  "Workspace",
  "Billing",
  "Factory",
  "Departments",
  "Users",
  "Review",
];

// Reusable progress bar for the onboarding wizard.
// `current` is the label of the active step (defaults to "Billing" since
// that's the step this component was originally built for).
export default function OnboardingProgress({ current = "Billing" }) {
  const currentIndex = STEPS.indexOf(current);

  return (
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
        {STEPS.map((label, i) => {
          let color = "#9ca3af"; // upcoming
          let prefix = "○";
          if (i < currentIndex) {
            color = "#16a34a"; // done
            prefix = "✓";
          } else if (i === currentIndex) {
            color = "#2563eb"; // active
            prefix = "●";
          }
          return (
            <span key={label} style={{ color }}>
              {prefix} {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
