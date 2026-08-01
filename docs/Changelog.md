TextileIE Changelog

All notable changes to this project will be documented here.



Version 1.0.0 (In Development)

2026-08-01 — Department Setup + critical build fix


Fixed BillingSummaryStep.jsx: it imported OnboardingProgress plus 6 section components and a billingCalculations.js util that did not exist in the repo. The project did not build at all until these were restored. Added a shared, reusable OnboardingProgress component (accepts a current step label) and the 6 missing summary sections plus the billing calculation util.

Completed FactoryStep.jsx: it was missing its Contact/Address and Working Hours/Capacity sections (left mid-build with a "PART 2" comment) and had no Previous/Continue buttons, so the wizard could not advance past step 8. Both are now implemented, matching the existing field/card styling.

Built Department Setup (DepartmentStep/) as onboarding step 9, following the same modular pattern as FactoryStep/: quick-add presets for common garment-factory departments (Cutting, Sewing, Finishing, QA, Warehouse, etc.), a custom-department form, inline validation (unique names, at least one department required), and a summary table. Wired into CustomerOnboardingPage.jsx.

Verified with npm run build — succeeds with no errors.


2026-08-01 — Documentation audit and correction

Docs (ModuleStatus.md, this entry) were found out of sync with the actual codebase — several modules were marked "Not Started" despite already being built and routed in App.jsx. Corrected to reflect actual state:



Factory Setup confirmed built (not deleted, not pending) — modular FactoryStep/ folder, wired at onboarding step 8.

Billing Summary confirmed built — wired at onboarding step 7.

Master Data: Fabric Master, Thread Master, Stitch Master confirmed built and routed.

Engineering: Style Library, Fabric Engineering, Thread Engineering, SMV, Efficiency, Capacity, Costing confirmed built and routed.

Export Orders, Fabric Requirements, Thread Requirements confirmed built and routed.

Reports (basic) confirmed built and routed.

Logged architecture debt: src/lib/db.js (~86KB, ~89 exports, unsplit) and several 1000+ line page components (ExportOrdersPage.jsx, FabricPage.jsx, EffCapPages.jsx) exceed the project's own file-size guideline.


Documentation


Added project documentation structure.

Added Architecture documentation.

Added Database design documentation.

Added Business Rules documentation.

Added Development Roadmap.

Added UI Standards.

Added Module Status tracker.


Onboarding

Completed:



Company Setup

Owner Setup

Subscription

Module Selection

Workspace Features

Workspace Configuration

Billing Summary

Factory Setup

Department Setup


Remaining:



User Invitation

Review Workspace

Supabase Integration

Welcome Dashboard



Future Releases

Version 1.1

To be updated after release.


Version 1.2

To be updated after release.


Version 2.0

Major ERP Expansion.

