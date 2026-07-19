import { useMemo, useState } from "react";
import {
  Building2, Save, ArrowRight, X, Upload
} from "lucide-react";

export default function CustomerOnboardingPage() {
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
          <button className="btn btn-primary btn-full" style={{marginTop:12}}>Continue to Owner</button>
          <button className="btn btn-secondary btn-full" style={{marginTop:8}}><X size={15}/>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Build 3 additions for CustomerOnboardingPage
// Replace your current page with this file after merging if desired.
// This version focuses on the Owner step.

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, User, ArrowLeft, ArrowRight } from "lucide-react";

export default function OwnerStepCard() {
  const [show,setShow]=useState(false);
  const [owner,setOwner]=useState({
    firstName:"",
    lastName:"",
    email:"",
    phone:"",
    countryCode:"+92",
    designation:"Owner",
    username:"",
    password:"",
    confirmPassword:"",
    twoFA:false,
    verifyEmail:true,
    forceChange:true,
    accept:false
  });

  const update=(k,v)=>{
    const n={...owner,[k]:v};
    if(k==="email" && !owner.username){
      n.username=v.split("@")[0];
    }
    setOwner(n);
  }

  const strength = owner.password.length<8?"Weak":
    /[A-Z]/.test(owner.password)&&/\d/.test(owner.password)&&/[!@#$%^&*]/.test(owner.password)
    ?"Strong":"Medium";

  return (
    <div className="card">
      <h2><User size={18}/> Company Owner & Workspace Administrator</h2>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:16}}>
        {["firstName","lastName","email","phone","username"].map(f=>(
          <div className="field" key={f}>
            <label>{f}</label>
            <input value={owner[f]} onChange={e=>update(f,e.target.value)}/>
          </div>
        ))}

        <div className="field">
          <label>Designation</label>
          <select value={owner.designation} onChange={e=>update("designation",e.target.value)}>
            <option>Owner</option><option>CEO</option><option>Director</option><option>Admin</option>
          </select>
        </div>

        <div className="field">
          <label>Password</label>
          <div style={{display:"flex",gap:8}}>
            <input type={show?"text":"password"} value={owner.password} onChange={e=>update("password",e.target.value)}/>
            <button type="button" className="btn btn-secondary" onClick={()=>setShow(!show)}>
              {show?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
          <small>Password Strength: <strong>{strength}</strong></small>
        </div>

        <div className="field">
          <label>Confirm Password</label>
          <input type={show?"text":"password"} value={owner.confirmPassword}
            onChange={e=>update("confirmPassword",e.target.value)}/>
        </div>
      </div>

      <div className="divider"></div>

      <label><input type="checkbox" checked={owner.twoFA} onChange={e=>update("twoFA",e.target.checked)}/> Enable Two-Factor Authentication</label><br/>
      <label><input type="checkbox" checked={owner.verifyEmail} onChange={e=>update("verifyEmail",e.target.checked)}/> Send verification email</label><br/>
      <label><input type="checkbox" checked={owner.forceChange} onChange={e=>update("forceChange",e.target.checked)}/> Force password change on first login</label><br/>
      <label><input type="checkbox" checked={owner.accept} onChange={e=>update("accept",e.target.checked)}/> Accept Terms & Conditions *</label>

      <div className="divider"></div>

      <div className="info-banner">
        <ShieldCheck size={16}/>
        This account will automatically become the Workspace Owner with full permissions.
      </div>

      <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
        <button className="btn btn-secondary"><ArrowLeft size={16}/> Previous</button>
        <button className="btn btn-primary">Next <ArrowRight size={16}/></button>
      </div>
    </div>
  );
}
