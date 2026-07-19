import { useMemo, useState } from "react";
import {
  Building2, Save, ArrowRight, X, Upload
} from "lucide-react";

import OwnerStep from "../components/customer-onboarding/steps/OwnerStep.jsx";
import SubscriptionStep from "../components/customer-onboarding/steps/SubscriptionStep.jsx";
import ModuleStep from "../components/customer-onboarding/steps/ModuleStep.jsx";
import WorkspaceFeaturesStep from "../components/customer-onboarding/steps/WorkspaceFeaturesStep.jsx";
export default function CustomerOnboardingPage() {
  const [step, setStep] = useState(1);
  const [subscription, setSubscription] = useState(null);
  const [modules, setModules] = useState(null);
  const [workspaceFeatures, setWorkspaceFeatures] = useState(null);
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

  const update=(k,v)=>{
    const next={...company,[k]:v};
    if(k==="companyName"){
      const parts=v.trim().split(/\s+/).filter(Boolean);
      const code=(parts.map(p=>p[0]).join("").toUpperCase()||"CMP")+"001";
      next.companyCode=code;
    }
    setCompany(next);
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
  onPrevious={() => setStep(1)}
  onNext={() => setStep(3)}
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

          alert(
            "Workspace features saved. Billing Summary will be added in Build 4D."
          );
        }}
      />
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
            {field("Country *","country")}
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
            {field("Currency *","currency")}
            {field("Timezone *","timezone")}
            {field("Language","language")}
            {field("Date Format","dateFormat")}
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
