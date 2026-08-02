import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Save, ArrowRight, X, Upload
} from "lucide-react";
import SearchSelect from "../components/common/SearchSelect.jsx";
import { getMasterCountries, getMasterCurrencies, getMasterTimezones, getMasterLanguages } from "../lib/db.js";
import BillingSummaryStep from "../components/customer-onboarding/steps/BillingSummaryStep.jsx";
import OwnerStep from "../components/customer-onboarding/steps/OwnerStep.jsx";
import WorkspaceStep from "../components/customer-onboarding/steps/WorkspaceStep";
import SubscriptionStep from "../components/customer-onboarding/steps/SubscriptionStep.jsx";
import ModuleStep from "../components/customer-onboarding/steps/ModuleStep.jsx";
import WorkspaceFeaturesStep from "../components/customer-onboarding/steps/WorkspaceFeaturesStep.jsx";
import FactoryStep from "../components/customer-onboarding/steps/FactoryStep";
import DepartmentStep from "../components/customer-onboarding/steps/DepartmentStep";
import UserInvitationStep from "../components/customer-onboarding/steps/UserInvitationStep";
import ReviewWorkspaceStep from "../components/customer-onboarding/steps/ReviewWorkspaceStep";
import { defaultRoles } from "../components/customer-onboarding/steps/UserInvitationStep/userInvitationDefaults.js";
import WelcomeStep from "../components/customer-onboarding/steps/WelcomeStep";
import { createCompanyWorkspace, finalizeOnboardingInvitations } from "../lib/db.js";
import { useAuth } from "../hooks/useAuth.jsx";
export default function CustomerOnboardingPage() {
  const { access } = useAuth();

  // Internal TextileIE Team only — same guard pattern as
  // PlatformAdminPage.jsx / PlatformDashboardPage.jsx. Ordinary
  // customers get an automatic trial workspace on signup instead
  // (see ensure_trial_workspace RPC) and never reach this wizard.
  if (!access?.isPlatformAdmin) {
    return <div className="empty-state"><p>TextileIE Platform Administrator access is required.</p></div>;
  }
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [modules, setModules] = useState(null);
  const [workspaceFeatures, setWorkspaceFeatures] = useState(null);
  const [workspace, setWorkspace] = useState({
  workspaceName: "",
  workspaceCode: `TXT-${Date.now().toString().slice(-6)}`,
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
});
  const [factory, setFactory] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [invitations, setInvitations] = useState(null);
  const [bootstrapStatus, setBootstrapStatus] = useState("idle"); // idle | working | done | error
  const [bootstrapError, setBootstrapError] = useState(null);
  const [bootstrapResult, setBootstrapResult] = useState(null);
  const [owner, setOwner] = useState(null);
  const [company,setCompany]=useState({
    companyName:"",
    companyCode:"AUTO",
    legalName:"",
    businessType:"Manufacturer",
    industry:"Garments",
    registrationNo:"",
    taxNo:"",
    website:"",
    email:"",
    phone:"",
    country:"Pakistan",
    province:"",
    city:"",
    postalCode:"",
    address:"",
    currency:"PKR",
    timezone:"Asia/Karachi",
    language:"English",
    dateFormat:"DD/MM/YYYY",
    fiscalYear:"January"
  });

  // ── Global Master Data (countries/currencies/timezones/languages) ──
  // Single shared source of truth — see supabase/migrations/004_global_master_data.sql.
  // Loaded once; other onboarding steps and future pages (Factory,
  // Supplier, Buyer, etc.) should reuse this same pattern instead of
  // hardcoding their own option lists.
  const [masterData, setMasterData] = useState({
    countries: [], currencies: [], timezones: [], languages: [],
  });
  const [masterDataLoading, setMasterDataLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getMasterCountries(),
      getMasterCurrencies(),
      getMasterTimezones(),
      getMasterLanguages(),
    ])
      .then(([countries, currencies, timezones, languages]) => {
        if (mounted) setMasterData({ countries, currencies, timezones, languages });
      })
      .catch((err) => console.error("Failed to load master data:", err))
      .finally(() => { if (mounted) setMasterDataLoading(false); });
    return () => { mounted = false; };
  }, []);

  const countryOptions = useMemo(
    () => masterData.countries.map((c) => ({ value: c.name, label: `${c.flag_emoji} ${c.name}`, ...c })),
    [masterData.countries]
  );
  const currencyOptions = useMemo(
    () => masterData.currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name} (${c.symbol})` })),
    [masterData.currencies]
  );
  const timezoneOptions = useMemo(
    () => masterData.timezones.map((t) => ({ value: t.iana_name, label: t.label })),
    [masterData.timezones]
  );
  const languageOptions = useMemo(
    () => masterData.languages.map((l) => ({ value: l.english_name, label: `${l.english_name} (${l.native_name})` })),
    [masterData.languages]
  );
  // Small fixed enumeration — not global master data (no reuse
  // value across other pages the way countries/currencies have),
  // so a local list is the right call rather than another DB table.
  const dateFormatOptions = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const mmm = monthNames[today.getMonth()];

    const patterns = [
      { value: "DD/MM/YYYY", example: `${dd}/${mm}/${yyyy}` },
      { value: "MM/DD/YYYY", example: `${mm}/${dd}/${yyyy}` },
      { value: "YYYY-MM-DD", example: `${yyyy}-${mm}-${dd}` },
      { value: "DD-MM-YYYY", example: `${dd}-${mm}-${yyyy}` },
      { value: "DD.MM.YYYY", example: `${dd}.${mm}.${yyyy}` },
      { value: "DD-MMM-YYYY", example: `${dd}-${mmm}-${yyyy}` },
    ];
    return patterns.map((p) => ({ value: p.value, label: `${p.value}  —  ${p.example}` }));
  }, []);

  const update=(k,v)=>{
    const next={...company,[k]:v};
    if(k==="companyName"){
      const parts=v.trim().split(/\s+/).filter(Boolean);
      const code=(parts.map(p=>p[0]).join("").toUpperCase()||"CMP")+"001";
      next.companyCode=code;
    }
    setCompany(next);
  };

  // Selecting a country auto-fills currency/timezone/language from
  // master data — the person can still override each afterward via
  // its own SearchSelect.
  const updateCountry = (value, option) => {
    setCompany((prev) => ({
      ...prev,
      country: value || "",
      currency: option?.currency_code || prev.currency,
      timezone: option?.default_timezone || prev.timezone,
      language: option
        ? (masterData.languages.find((l) => l.code === option.default_language)?.english_name || prev.language)
        : prev.language,
    }));
  };

  const required=["companyName","businessType","country","currency","timezone"];
  const missing=useMemo(()=>required.filter(k=>!company[k]),[company]);

  const field=(label,key,type="text")=>(
    <div className="field" key={key}>
      <label>{label}</label>
      <input type={type} value={company[key]} onChange={e=>update(key,e.target.value)}/>
      {required.includes(key)&&!company[key] && <small style={{color:"var(--red)"}}>Required</small>}
    </div>
  );
if (step === 2) {
  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Customer Onboarding</h1>
          <p>Configure the workspace owner and administrator account.</p>
        </div>
      </div>
<OwnerStep
  initialOwner={owner}
  onPrevious={() => setStep(1)}
  onNext={(ownerData) => {
    setOwner(ownerData);
    setStep(3);
  }}
/>
    </div>
  );
}
  if (step === 3) {
  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Customer Onboarding</h1>
          <p>
            Select the subscription plan and workspace limits.
          </p>
        </div>
      </div>

      <SubscriptionStep
  initialPlan={subscription?.planId || "professional"}
  initialBillingCycle={
    subscription?.billingCycle || "monthly"
  }
  onPrevious={() => setStep(2)}
  onNext={(selectedSubscription) => {
    setSubscription(selectedSubscription);
    setStep(4);
  }}
/>
    </div>
  );
}
  if (step === 4) {
  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Customer Onboarding</h1>
          <p>
            Select the TextileIE modules for this workspace.
          </p>
        </div>
      </div>
<ModuleStep
  initialModules={modules?.moduleIds}
  onPrevious={() => setStep(3)}
  onNext={(selectedModules) => {
    setModules(selectedModules);
    setStep(5);
  }}
/>
    </div>
  );
}
  if (step === 5) {
  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>

          <h1>Customer Onboarding</h1>

          <p>
            Configure workspace notifications, integrations,
            intelligence and governance controls.
          </p>
        </div>
      </div>

      <WorkspaceFeaturesStep
        initialFeatures={workspaceFeatures?.featureIds}
        onPrevious={() => setStep(4)}
        onNext={(selectedFeatures) => {
          setWorkspaceFeatures(selectedFeatures);
          setStep(6);
        }}
      />
    </div>
  );
  }
  if (step === 6) {
  return (
    <WorkspaceStep
  companyName={company.companyName}
  initialWorkspace={workspace}
  languageOptions={languageOptions}
  currencyOptions={currencyOptions}
  timezoneOptions={timezoneOptions}
  dateFormatOptions={dateFormatOptions}
  masterDataLoading={masterDataLoading}
  onPrevious={() => setStep(5)}
  onNext={(workspaceData) => {
    setWorkspace(workspaceData);
    setStep(7);
  }}
/>
  );
  }
  // Step 7
  if (step === 7) {
  return (
    <BillingSummaryStep
      company={company}
      owner={owner}
      subscription={subscription}
      modules={modules}
      workspace={workspace}
      workspaceFeatures={workspaceFeatures}
      onPrevious={() => setStep(6)}
      onNext={() => setStep(8)}
    />
  );
}
  if (step === 8) {
  return (
    <FactoryStep
      initialFactory={factory}
      countryOptions={countryOptions}
      currencyOptions={currencyOptions}
      timezoneOptions={timezoneOptions}
      masterDataLoading={masterDataLoading}
      onPrevious={() => setStep(7)}
      onNext={(factoryData) => {
        setFactory(factoryData);
        setStep(9);
      }}
    />
  );
  }
  if (step === 9) {
  return (
    <DepartmentStep
      factory={factory}
      initialDepartments={departments}
      onPrevious={() => setStep(8)}
      onNext={(departmentData) => {
        setDepartments(departmentData);
        setStep(10);
      }}
    />
  );
}
  if (step === 10) {
  return (
    <UserInvitationStep
      departments={departments}
      initialInvitations={invitations}
      onPrevious={() => setStep(9)}
      onNext={(invitationData) => {
        setInvitations(invitationData);
        setStep(11);
      }}
    />
  );
}
  if (step === 11) {
  return (
    <ReviewWorkspaceStep
      company={company}
      owner={owner}
      subscription={subscription}
      modules={modules}
      workspace={workspace}
      workspaceFeatures={workspaceFeatures}
      factory={factory}
      departments={departments}
      invitations={invitations}
      onPrevious={() => setStep(10)}
      onNext={() => setStep(12)}
    />
  );
}
  if (step === 12 && bootstrapStatus === "done") {
  return (
    <WelcomeStep
      company={company}
      factory={factory}
      departments={departments}
      modules={modules}
      invitations={invitations}
      bootstrapResult={bootstrapResult}
    />
  );
}
  if (step === 12) {
  const runBootstrap = async () => {
    setBootstrapStatus("working");
    setBootstrapError(null);
    try {
      const result = await createCompanyWorkspace({
        company,
        subscription,
        modules,
        factory,
        departments,
      });
      setBootstrapResult(result);
      if (invitations && invitations.length > 0) {
        await finalizeOnboardingInvitations(invitations, result, defaultRoles);
      }
      setBootstrapStatus("done");
    } catch (err) {
      setBootstrapError(err?.message || "Something went wrong creating your workspace.");
      setBootstrapStatus("error");
    }
  };

  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Creating Your Workspace</h1>
          <p>
            This writes your company, factory, departments, roles, and modules to TextileIE in one step.
          </p>
        </div>
      </div>

      <div className="card">
        {bootstrapStatus === "idle" && (
          <>
            <p style={{ color: "var(--text-secondary)" }}>
              Everything you entered is ready to be created. This can't be
              undone from this screen — you'll manage it from Settings
              afterward.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={runBootstrap}
            >
              Create Workspace
            </button>
          </>
        )}

        {bootstrapStatus === "working" && (
          <p style={{ color: "var(--text-secondary)" }}>Creating your workspace…</p>
        )}

        {bootstrapStatus === "error" && (
          <>
            <p style={{ color: "#dc2626" }}>{bootstrapError}</p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={runBootstrap}
            >
              Try Again
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        style={{ marginTop: 16 }}
        onClick={() => setStep(11)}
      >
        Back to Review
      </button>
    </div>
  );
}
  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Customer Onboarding</h1>
          <p>Create a new TextileIE customer workspace.</p>
        </div>
        <div className="module-hero-actions">
          <button className="btn btn-secondary"><Save size={15}/>Save Draft</button>
          <button className="btn btn-primary">Continue <ArrowRight size={15}/></button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <div className="card">
          <h2 style={{marginBottom:16}}>Company Profile</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {field("Company Name *","companyName")}
            {field("Company Code","companyCode")}
            {field("Legal Company Name","legalName")}
            {field("Business Type *","businessType")}
            {field("Industry","industry")}
            {field("Registration No.","registrationNo")}
            {field("Tax / NTN / VAT","taxNo")}
            {field("Website","website")}
            {field("Company Email","email","email")}
            {field("Phone","phone")}
          </div>

          <div className="divider"></div>
          <h2 style={{marginBottom:16}}>Address</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <SearchSelect
              label="Country *"
              required
              placeholder="Search countries…"
              options={countryOptions}
              value={company.country}
              loading={masterDataLoading}
              onChange={updateCountry}
            />
            {field("Province","province")}
            {field("City","city")}
            {field("Postal Code","postalCode")}
          </div>
          <div className="field">
            <label>Complete Address</label>
            <textarea value={company.address} onChange={e=>update("address",e.target.value)} rows={3}/>
          </div>

          <div className="divider"></div>
          <h2 style={{marginBottom:16}}>Regional Settings</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <SearchSelect
              label="Currency *"
              required
              placeholder="Search currencies…"
              options={currencyOptions}
              value={company.currency}
              loading={masterDataLoading}
              onChange={(v) => update("currency", v || "")}
            />
            <SearchSelect
              label="Timezone *"
              required
              placeholder="Search timezones…"
              options={timezoneOptions}
              value={company.timezone}
              loading={masterDataLoading}
              onChange={(v) => update("timezone", v || "")}
            />
            <SearchSelect
              label="Language"
              placeholder="Search languages…"
              options={languageOptions}
              value={company.language}
              loading={masterDataLoading}
              onChange={(v) => update("language", v || "")}
            />
            <SearchSelect
              label="Date Format"
              placeholder="Search date formats…"
              options={dateFormatOptions}
              value={company.dateFormat}
              onChange={(v) => update("dateFormat", v || "")}
            />
            {field("Fiscal Year","fiscalYear")}
          </div>

          <div className="divider"></div>
          <button className="btn btn-secondary"><Upload size={15}/>Upload Company Logo</button>
        </div>

        <div className="card">
          <h2>Workspace Summary</h2>
          <div className="divider"></div>
          <p><strong>{company.companyName||"Company Name"}</strong></p>
          <p>Code: {company.companyCode}</p>
          <p>Business: {company.businessType}</p>
          <p>Industry: {company.industry}</p>
          <p>Country: {company.country}</p>
          <p>Currency: {company.currency}</p>
          <p>Timezone: {company.timezone}</p>
          <div className="divider"></div>
          <p>Subscription: <strong>Not Selected</strong></p>
          <p>Modules: <strong>0 Selected</strong></p>
          <p>Factories: <strong>0</strong></p>
          <p>Users: <strong>0</strong></p>
          <div className="divider"></div>
          <p style={{color: missing.length?"var(--red)":"var(--green)"}}>
            {missing.length?`${missing.length} required fields remaining`:"Company information complete"}
          </p>
          <button
  type="button"
  className="btn btn-primary btn-full"
  style={{ marginTop: 12 }}
  onClick={() => setStep(2)}
  disabled={missing.length > 0}
>
  Continue to Owner
</button>
          <button className="btn btn-secondary btn-full" style={{marginTop:8}}><X size={15}/>Cancel</button>
        </div>
      </div>
    </div>
  );
        }
