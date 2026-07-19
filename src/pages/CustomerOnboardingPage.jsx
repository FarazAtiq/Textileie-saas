
import { useMemo, useState } from "react";
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
    companyName:"",
    companyCode:"AUTO",
    businessType:"Manufacturer",
    industry:"Garments",
    country:"Pakistan",
    province:"",
    city:"",
    currency:"PKR",
    timezone:"Asia/Karachi",
    website:"",
  });

  const steps=[
    {title:"Company",icon:Building2},
    {title:"Owner",icon:User},
    {title:"Subscription",icon:CreditCard},
    {title:"Modules",icon:Package},
    {title:"Factory",icon:Factory},
    {title:"Review",icon:ClipboardCheck},
  ];

  const progress=useMemo(()=>Math.round(step/steps.length*100),[step]);

  const update=(k,v)=>setCompany({...company,[k]:v});

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Onboarding</h1>
          <p className="text-gray-500">Create a new customer workspace</p>
        </div>
        <button className="border rounded-lg px-4 py-2 flex gap-2 items-center">
          <Save size={18}/>Save Draft
        </button>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="flex justify-between mb-2">
          <span>Step {step} of {steps.length}</span>
          <span className="font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded">
          <div className="h-2 bg-blue-600 rounded" style={{width:`${progress}%`}}/>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {steps.map((s,i)=>{
          const I=s.icon;
          return <div key={s.title} className={`border rounded-xl p-3 ${i+1===step?"bg-blue-600 text-white":"bg-white"}`}>
            <I size={18}/>
            <div className="mt-2 text-sm font-semibold">{s.title}</div>
          </div>
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-xl mb-4">Company Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="border rounded-lg p-3" placeholder="Company Name" value={company.companyName} onChange={e=>update("companyName",e.target.value)}/>
            <input className="border rounded-lg p-3 bg-gray-100" value={company.companyCode} readOnly/>
            <input className="border rounded-lg p-3" placeholder="Business Type" value={company.businessType} onChange={e=>update("businessType",e.target.value)}/>
            <input className="border rounded-lg p-3" placeholder="Industry" value={company.industry} onChange={e=>update("industry",e.target.value)}/>
            <input className="border rounded-lg p-3" placeholder="Country" value={company.country} onChange={e=>update("country",e.target.value)}/>
            <input className="border rounded-lg p-3" placeholder="Province" value={company.province} onChange={e=>update("province",e.target.value)}/>
            <input className="border rounded-lg p-3" placeholder="City" value={company.city} onChange={e=>update("city",e.target.value)}/>
            <input className="border rounded-lg p-3" placeholder="Currency" value={company.currency} onChange={e=>update("currency",e.target.value)}/>
            <input className="border rounded-lg p-3" placeholder="Timezone" value={company.timezone} onChange={e=>update("timezone",e.target.value)}/>
            <input className="border rounded-lg p-3" placeholder="Website" value={company.website} onChange={e=>update("website",e.target.value)}/>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-xl mb-4">Workspace Summary</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-500">Company</span><div className="font-semibold">{company.companyName||"—"}</div></div>
            <div><span className="text-gray-500">Code</span><div>{company.companyCode}</div></div>
            <div><span className="text-gray-500">Country</span><div>{company.country}</div></div>
            <div><span className="text-gray-500">Currency</span><div>{company.currency}</div></div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button className="border rounded-lg px-5 py-3 flex items-center gap-2"><X size={18}/>Cancel</button>
        <button onClick={()=>setStep(Math.min(step+1,steps.length))} className="bg-blue-600 text-white rounded-lg px-5 py-3 flex items-center gap-2">Continue<ArrowRight size={18}/></button>
      </div>
    </div>
  );
}
