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
