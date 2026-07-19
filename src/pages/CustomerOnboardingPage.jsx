
import { useState } from "react";
import {
  Building2,
  User,
  CreditCard,
  Package,
  Factory,
  ClipboardCheck,
  Save,
  ArrowRight,
  X,
} from "lucide-react";

export default function CustomerOnboardingPage() {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState({
    companyName: "",
    companyCode: "AUTO",
    businessType: "Manufacturer",
    industry: "Garments",
    country: "Pakistan",
    province: "",
    city: "",
    currency: "PKR",
    timezone: "Asia/Karachi",
    website: "",
  });

  const update=(k,v)=>setCompany({...company,[k]:v});

  const steps=[
    {title:"Company",icon:Building2},
    {title:"Owner",icon:User},
    {title:"Subscription",icon:CreditCard},
    {title:"Modules",icon:Package},
    {title:"Factory",icon:Factory},
    {title:"Review",icon:ClipboardCheck},
  ];

  return (
    <div className="app-main">
      <div className="module-hero">
        <div>
          <div className="eyebrow">Platform</div>
          <h1>Customer Onboarding</h1>
          <p>Create a new TextileIE customer workspace.</p>
        </div>

        <div className="module-hero-actions">
          <button className="btn btn-secondary">
            <Save size={16}/> Save Draft
          </button>
          <button className="btn btn-primary">
            Continue <ArrowRight size={16}/>
          </button>
        </div>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          {steps.map((s,i)=>{
            const I=s.icon;
            const active=i+1===step;
            return (
              <div key={s.title}
                style={{
                  flex:1,
                  margin:"0 4px",
                  padding:12,
                  borderRadius:10,
                  textAlign:"center",
                  background:active?"var(--teal)":"var(--bg)",
                  color:active?"white":"var(--text-primary)"
                }}>
                <I size={18}/>
                <div style={{marginTop:6,fontSize:12,fontWeight:600}}>{s.title}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <div className="card">
          <h2>Company Information</h2>

          {[
            ["Company Name","companyName"],
            ["Business Type","businessType"],
            ["Industry","industry"],
            ["Country","country"],
            ["Province","province"],
            ["City","city"],
            ["Currency","currency"],
            ["Timezone","timezone"],
            ["Website","website"],
          ].map(([label,key])=>(
            <div className="field" key={key}>
              <label>{label}</label>
              <input
                value={company[key]}
                onChange={e=>update(key,e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Workspace Summary</h2>
          <div className="divider"></div>

          <div className="field">
            <label>Company</label>
            <strong>{company.companyName||"-"}</strong>
          </div>

          <div className="field">
            <label>Company Code</label>
            <strong>{company.companyCode}</strong>
          </div>

          <div className="field">
            <label>Business</label>
            <strong>{company.businessType}</strong>
          </div>

          <div className="field">
            <label>Country</label>
            <strong>{company.country}</strong>
          </div>

          <div className="field">
            <label>Currency</label>
            <strong>{company.currency}</strong>
          </div>

          <div className="divider"></div>

          <button className="btn btn-primary btn-full">
            Continue to Owner
          </button>

          <button className="btn btn-secondary btn-full" style={{marginTop:8}}>
            <X size={16}/> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
