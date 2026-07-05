import { useState } from 'react';
import { calcFabricYards, calcFabricGSM, formatNum } from '../utils/calculations.js';
import { calcBomConsumption, defaultRatioForSize } from '../utils/fabricBomCalc.js';
import { calcKgToMeter, calcMeterToKg, metersToYards, cmToInch } from '../utils/kgMeterCalc.js';
import { PageHeader, CalcGrid } from '../components/ResultCard.jsx';
import { createReport, upsertStyleCostModule } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { exportBomPDF, exportBomExcel } from '../utils/bomExport.js';
import { Plus, Trash2, Save, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ArticleSelector } from '../components/ArticleSelector.jsx';

function useSave(type, titleFn, inputs, results) {
  const [saving, setSaving] = useState(false);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();
  const save = async () => {
    setSaving(true);
    try {
      await createReport({ type, title: titleFn(), inputs, results });
      toast('Report saved');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };
  const doExport = (title) => exportReportPDF({ type, title, inputs, results, companyName: profile?.company_name, userName: profile?.full_name });
  return { save, doExport, saving, ToastContainer, profile };
}

const TABS = [
  { id: 'quick', label: 'Quick Consumption' },
  { id: 'bom',   label: 'BOM Sheet' },
  { id: 'conv',  label: 'Kg \u21C4 Meter' },
];

export default function FabricPage() {
  const [activeTab, setActiveTab] = useState('quick');
  return (
    <div>
      <PageHeader title="Fabric Consumption" subtitle="Quick calculator, full BOM sheet, and unit converter" badge={{ text: 'IE Formula' }} />
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border-light)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit', whiteSpace: 'nowrap',
            color: activeTab === t.id ? 'var(--teal)' : 'var(--text-muted)',
            borderBottom: activeTab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>
      {activeTab === 'quick' && <QuickConsumptionTab />}
      {activeTab === 'bom'   && <BomSheetTab />}
      {activeTab === 'conv'  && <ConverterTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 1 — QUICK CONSUMPTION
// ════════════════════════════════════════════════════════════
function QuickConsumptionTab() {
  const [tab, setTab] = useState('yards');
  const [yds, setYds] = useState({ widthInches: 58, garmentLengthCm: 70, wastePct: 12, orderQty: 1000, pricePerYard: 2.5 });
  const [gsm, setGsm] = useState({ lengthCm: 70, widthCm: 120, gsm: 180, patternPieces: 4, wastePct: 10, orderQty: 1000 });
  const ry = calcFabricYards(yds);
  const rg = calcFabricGSM(gsm);
  const setY = k => e => setYds(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const setG = k => e => setGsm(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const { save: saveY, doExport: expY, saving: savingY, ToastContainer } = useSave('fabric', () => 'Fabric (Yds) \u2014 ' + new Date().toLocaleDateString(), yds, ry);
  const { save: saveG, doExport: expG, saving: savingG } = useSave('fabric', () => 'Fabric (GSM) \u2014 ' + new Date().toLocaleDateString(), gsm, rg);
  return (
    <div>
      <ToastContainer />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['yards','Yards method'],['gsm','GSM / Weight method']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} className={'btn btn-sm '+(tab===t?'btn-primary':'btn-secondary')}>{l}</button>
        ))}
      </div>
      {tab === 'yards' && (
        <CalcGrid>
          <div className="card">
            <h3 style={{marginBottom:16}}>Inputs</h3>
            {[['widthInches','Fabric width (inches)'],['garmentLengthCm','Garment length (cm)'],['wastePct','Wastage %'],['orderQty','Order quantity (pcs)'],['pricePerYard','Price per yard (USD)']].map(([k,l])=>(
              <div className="field" key={k}><label>{l}</label><input type="number" step={k==='pricePerYard'?'0.01':'1'} value={yds[k]} onChange={setY(k)} /></div>
            ))}
          </div>
          <div className="card">
            <h3 style={{marginBottom:14}}>Results</h3>
            {[['Gross yards/unit',formatNum(ry.grossYards,3)+' yds',true],['Net yards/unit',formatNum(ry.netYards,4)+' yds',false],['Waste/unit',formatNum(ry.wasteYardsPerUnit,4)+' yds',false],['Total yards (order)',formatNum(ry.totalYards,1)+' yds',true],['Cost/unit','$'+formatNum(ry.costPerUnit),false],['Total fabric cost','$'+formatNum(ry.totalCost),true]].map(([l,v,h])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border-light)',fontSize:13}}>
                <span style={{color:'var(--text-secondary)'}}>{l}</span>
                <span style={{fontFamily:'JetBrains Mono',fontWeight:h?700:500,color:h?'var(--teal)':'var(--text-primary)'}}>{v}</span>
              </div>
            ))}
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={saveY} disabled={savingY}><Save size={14}/>{savingY?'Saving...':'Save'}</button>
              <button className="btn btn-secondary" onClick={()=>expY('Fabric Consumption (Yards)')}><Download size={14}/></button>
            </div>
          </div>
        </CalcGrid>
      )}
      {tab === 'gsm' && (
        <CalcGrid>
          <div className="card">
            <h3 style={{marginBottom:16}}>GSM Inputs</h3>
            {[['lengthCm','Length (cm)'],['widthCm','Width (cm)'],['gsm','GSM value'],['patternPieces','Pattern pieces'],['wastePct','Wastage %'],['orderQty','Order qty (pcs)']].map(([k,l])=>(
              <div className="field" key={k}><label>{l}</label><input type="number" value={gsm[k]} onChange={setG(k)} /></div>
            ))}
          </div>
          <div className="card">
            <h3 style={{marginBottom:14}}>Results</h3>
            {[['Gross weight/unit',formatNum(rg.grossWeightKg,3)+' kg',true],['Net area',formatNum(rg.totalNetArea,4)+' m\u00B2',false],['Net weight/unit',formatNum(rg.netWeightKg,4)+' kg',false],['Waste/unit',formatNum(rg.wasteKgPerUnit,4)+' kg',false],['Total weight (order)',formatNum(rg.totalWeightKg)+' kg',true]].map(([l,v,h])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border-light)',fontSize:13}}>
                <span style={{color:'var(--text-secondary)'}}>{l}</span>
                <span style={{fontFamily:'JetBrains Mono',fontWeight:h?700:500,color:h?'var(--teal)':'var(--text-primary)'}}>{v}</span>
              </div>
            ))}
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={saveG} disabled={savingG}><Save size={14}/>{savingG?'Saving...':'Save'}</button>
              <button className="btn btn-secondary" onClick={()=>expG('Fabric Consumption (GSM)')}><Download size={14}/></button>
            </div>
          </div>
        </CalcGrid>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2 — BOM SHEET
// ════════════════════════════════════════════════════════════
const newComponent = (num) => ({
  id: Date.now() + num + Math.random(),
  compNo: num,
  usageAt: '',
  fabricDescription: '',
  fabricCode: '',
  supplier: '',
  gsm: '',
  fabricWidth: '',
  widthUnit: 'inch',
  uom: 'KG',
  allowancePct: 4,
  sizeData: {},
});

const newSize = (label) => ({ id: Date.now() + Math.random(), label });

function BomSheetTab() {
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);

  // Header
  const [artNo,         setArtNo]         = useState('5400');
  const [styleName,     setStyleName]     = useState('Simple Pant');
  const [customer,      setCustomer]      = useState('Nike');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [techPackRef,   setTechPackRef]   = useState('');
  const [consumptionNo, setConsumptionNo] = useState('');
  const [issueDate,     setIssueDate]     = useState(new Date().toISOString().slice(0, 10));
  const [docType,       setDocType]       = useState('costing');

  // Sizes
  const [sizes,      setSizes]      = useState([newSize('S'), newSize('M'), newSize('L'), newSize('XL'), newSize('2XL')]);
  const [baseSizeId, setBaseSizeId] = useState(null);

  // Components
  const [components, setComponents] = useState([
    { ...newComponent(1), usageAt: 'Main fabric', uom: 'KG', allowancePct: 4 },
  ]);

  // Sign-off
  const [signOff, setSignOff] = useState({ providedBy: '', approvedBy: '', receivedBy: '' });

  const handleStyleSelect = ({ style, color }) => {
    setSelectedStyle(style || null);
    setSelectedColor(color || null);
    if (style?.article_number) setArtNo(style.article_number);
    if (style?.style_name) setStyleName(style.style_name);
    if (style?.buyer) setCustomer(style.buyer);
    const styleSizes = style?.style_sizes || [];
    if (styleSizes.length) {
      const nextSizes = styleSizes.map(ss => ({ id: ss.id, label: ss.size_name || ss.label || 'Size' }));
      setSizes(nextSizes);
      const base = nextSizes.find(x => x.label === style.base_size) || nextSizes[0];
      setBaseSizeId(base?.id || null);
    }
  };

  // ── size helpers ──
  const addSize = () => setSizes([...sizes, newSize('Size ' + (sizes.length + 1))]);
  const removeSize = (id) => {
    setSizes(sizes.filter(s => s.id !== id));
    setComponents(components.map(c => { const sd = { ...c.sizeData }; delete sd[id]; return { ...c, sizeData: sd }; }));
  };
  const renameSize = (id, label) => setSizes(sizes.map(s => s.id === id ? { ...s, label } : s));

  // ── component helpers ──
  const addComponent = () => setComponents([...components, newComponent(components.length + 1)]);
  const removeComponent = (id) => setComponents(components.filter(c => c.id !== id).map((c, i) => ({ ...c, compNo: i + 1 })));
  const setComp = (id, key, val) => setComponents(components.map(c => c.id === id ? { ...c, [key]: val } : c));

  const getSizeData = (comp, sizeId) => comp.sizeData[sizeId] || { mode: 'manual', layLength: 0, noOfPcs: 4, efficiency: 70, ratio: 1.0 };

  const setSizeData = (compId, sizeId, key, val) => {
    setComponents(components.map(c => {
      if (c.id !== compId) return c;
      const current = getSizeData(c, sizeId);
      return { ...c, sizeData: { ...c.sizeData, [sizeId]: { ...current, [key]: val } } };
    }));
  };

  // ── calculation per component per size ──
  const calcForSize = (comp, sizeId) => {
  const sd = getSizeData(comp, sizeId);

  let layLength = parseFloat(sd.layLength) || 0;

  if (sd.mode === 'auto' && baseSizeId && sizeId !== baseSizeId) {
    const baseSd = getSizeData(comp, baseSizeId);
    const ratio = parseFloat(sd.ratio) || defaultRatioForSize(sizes.find(s => s.id === sizeId)?.label);
    layLength = (parseFloat(baseSd.layLength) || 0) * ratio;
  }

  const noOfPcs = parseFloat(sd.noOfPcs) || 1;
  const allowancePct = parseFloat(comp.allowancePct) || 0;

  const meterConsumption = (layLength / noOfPcs) * (1 + allowancePct / 100);

  const widthInches =
    comp.widthUnit === 'cm'
      ? cmToInch(parseFloat(comp.fabricWidth) || 0)
      : parseFloat(comp.fabricWidth) || 0;
const gsm = parseFloat(comp.gsm) || 0;

const kgConsumption =
  meterConsumption && gsm && widthInches
    ? 0.00000254 * meterConsumption * gsm * widthInches
    : 0;
  const yardConsumption = metersToYards(meterConsumption);

  let consumption = meterConsumption;

  {comp.uom === 'KG' && (!comp.gsm || !comp.fabricWidth) && (
  <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
    GSM and fabric width are required for KG calculation.
  </div>
)}
  if (comp.uom === 'YARD') consumption = yardConsumption;
  if (comp.uom === 'METER') consumption = meterConsumption;

  return {
    ...sd,
    layLength: +layLength.toFixed(3),
    meterConsumption: +meterConsumption.toFixed(4),
    kgConsumption: +kgConsumption.toFixed(4),
    yardConsumption: +yardConsumption.toFixed(4),
    consumption: +consumption.toFixed(4),
  };
};
  // ── PDF export — using shared utility ──
  const handleExportPDF = async () => {
    try {
      await exportBomPDF({
        artNo, styleName, customer, techPackRef, consumptionNo, issueDate,
        components, sizes, baseSizeId, signOff, docType,
        companyName: profile?.company_name, userName: profile?.full_name
      });
      toast('PDF downloaded');
    } catch (err) { console.error(err); toast('PDF failed: ' + err.message, 'error'); }
  };

  // ── Excel export — using shared utility ──
  const handleExportExcel = () => {
    exportBomExcel({
      artNo, styleName, customer, techPackRef, consumptionNo, issueDate,
      components, sizes, baseSizeId, signOff, docType
    });
    toast('Excel downloaded');
  };

  // ── Save to library — now stores FULL data ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const results = Object.fromEntries(sizes.map(s => [
        s.label + ' total',
        components.reduce((sum, c) => sum + calcForSize(c, s.id).consumption, 0).toFixed(3)
      ]));

      const savedReport = await createReport({
        type: 'fabric',
        title: 'Fabric BOM \u2014 ' + (artNo ? 'Art#' + artNo + ' ' : '') + (styleName || '') + ' \u2014 ' + new Date().toLocaleDateString(),
        inputs: {
          articleNumber: artNo, styleName, customer, style_id: selectedStyle?.id || null, color_id: selectedColor?.id || null, colorName: selectedColor?.color_name || '', baseSize: selectedStyle?.base_size || '', season: selectedStyle?.season || '', techPackRef,
          consumptionNo, issueDate, docType,
          components: components.length,
          sizes: sizes.map(s => s.label).join(', '),
          // Store full BOM data for reconstruction
          _bomData: JSON.stringify({
            artNo, styleName, customer, techPackRef, consumptionNo, issueDate,
            docType, sizes, baseSizeId, components, signOff
          })
        },
        results,
      });
      if (selectedStyle?.id) {
        const calculatedComponents = components.map(comp => ({
  ...comp,

  sizeData: Object.fromEntries(
    sizes.map(s => {
      const calc = calcForSize(comp, s.id);

      return [
        s.id,
        {
          ...getSizeData(comp, s.id),

          kgConsumption: calc.consumption,

          meterConsumption: calcKgToMeter({
            weightKg: calc.consumption,
            gsm: parseFloat(comp.gsm),
            widthInches:
              comp.widthUnit === 'cm'
                ? cmToInch(parseFloat(comp.fabricWidth) || 0)
                : parseFloat(comp.fabricWidth) || 0,
          }),

          yardConsumption: metersToYards(
            calcKgToMeter({
              weightKg: calc.consumption,
              gsm: parseFloat(comp.gsm),
              widthInches: parseFloat(comp.cuttableWidth),
            })
          ),
        },
      ];
    })
  ),
}));
        await upsertStyleCostModule({
          style_id: selectedStyle.id,
          color_id: selectedColor?.id || null,
          module_type: 'fabric_bom',
          data: { artNo, styleName, customer, techPackRef, consumptionNo, issueDate, docType, sizes, baseSizeId, components: calculatedComponents, signOff },
          summary: { results, components: calculatedComponents, sizes: sizes.map(s => s.label), article_number: artNo, style_name: styleName, buyer: customer }
        });
      }
      toast('Fabric BOM saved and linked to Style Master');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <ToastContainer />

      <ArticleSelector
        value={selectedStyle?.id}
        colorId={selectedColor?.id}
        label="Select from Style Master"
        onSelect={handleStyleSelect}
      />

      {/* Header info */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 18px' }}>
        <h3 style={{ marginBottom: 12 }}>Document info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="field"><label>Art#</label><input value={artNo} onChange={e=>setArtNo(e.target.value)} placeholder="5400" style={{fontFamily:'JetBrains Mono',fontWeight:700}} /></div>
          <div className="field"><label>Style Name</label><input value={styleName} onChange={e=>setStyleName(e.target.value)} placeholder="Simple Pant" /></div>
          <div className="field"><label>Customer</label><input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nike" /></div>
          <div className="field"><label>Tech Pack Ref#</label><input value={techPackRef} onChange={e=>setTechPackRef(e.target.value)} /></div>
          <div className="field"><label>Consumption #</label><input value={consumptionNo} onChange={e=>setConsumptionNo(e.target.value)} /></div>
          <div className="field"><label>Issue Date</label><input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} /></div>
        </div>
        {/* Document type — hidden from UI but still tracked for PDF/Excel */}
        <input type="hidden" value={docType} />
      </div>

      {/* Sizes */}
      <div className="card" style={{marginBottom:16,padding:'14px 18px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <h3>Sizes ({sizes.length})</h3>
          <button className="btn btn-secondary btn-sm" onClick={addSize}><Plus size={13}/> Add size</button>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {sizes.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 4px 4px 10px',background:baseSizeId===s.id?'var(--teal-light)':'var(--bg)',borderRadius:8,border:baseSizeId===s.id?'1px solid var(--teal)':'1px solid var(--border-light)'}}>
              <input value={s.label} onChange={e=>renameSize(s.id,e.target.value)} style={{width:60,fontSize:12,border:'none',background:'transparent',padding:'4px 2px'}}/>
              <button onClick={()=>setBaseSizeId(s.id)} style={{fontSize:10,padding:'3px 6px',borderRadius:4,border:'none',cursor:'pointer',background:baseSizeId===s.id?'var(--teal)':'var(--border-light)',color:baseSizeId===s.id?'white':'var(--text-muted)'}}>
                {baseSizeId===s.id?'BASE':'Set base'}
              </button>
              <button onClick={()=>removeSize(s.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:4}}><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
        {!baseSizeId && <p style={{fontSize:11,color:'var(--text-muted)',marginTop:8}}>Tip: set a base size to enable auto-scale grading for other sizes.</p>}
      </div>

      {/* Components */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3>Fabric components ({components.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={addComponent}><Plus size={13}/> Add component</button>
      </div>

      {components.map(comp => (
        <ComponentCard key={comp.id} comp={comp} sizes={sizes} baseSizeId={baseSizeId}
          getSizeData={getSizeData} setSizeData={setSizeData} calcForSize={calcForSize}
          setComp={setComp} removeComponent={removeComponent} canRemove={components.length > 1} />
      ))}

      {/* Sign-off */}
      <div className="card" style={{marginTop:16,padding:'16px 18px'}}>
        <h3 style={{marginBottom:12}}>Sign-off</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <div className="field"><label>Provided by \u2014 GGT</label><input value={signOff.providedBy} onChange={e=>setSignOff({...signOff,providedBy:e.target.value})}/></div>
          <div className="field"><label>Approved by \u2014 PD Manager</label><input value={signOff.approvedBy} onChange={e=>setSignOff({...signOff,approvedBy:e.target.value})}/></div>
          <div className="field"><label>Received by</label><input value={signOff.receivedBy} onChange={e=>setSignOff({...signOff,receivedBy:e.target.value})}/></div>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:20}}>
        <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}><Save size={14}/>{saving?'Saving...':'Save BOM report'}</button>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <button className="btn btn-secondary btn-full" onClick={handleExportPDF}><Download size={14}/> Download PDF</button>
          <button className="btn btn-full" onClick={handleExportExcel} style={{background:'#217346',color:'white',border:'none'}}><FileText size={14}/> Download Excel</button>
        </div>
      </div>
    </div>
  );
}

// ── Single component card ──
function ComponentCard({ comp, sizes, baseSizeId, getSizeData, setSizeData, calcForSize, setComp, removeComponent, canRemove }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
      <div style={{padding:'12px 16px',background:'var(--navy)',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>setExpanded(!expanded)}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{width:26,height:26,borderRadius:'50%',background:'var(--teal)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{comp.compNo}</span>
          <span style={{color:'white',fontWeight:600,fontSize:13}}>{comp.usageAt||comp.fabricDescription||'Component '+comp.compNo}</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginLeft:4}}>{comp.uom}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {canRemove&&<button onClick={e=>{e.stopPropagation();removeComponent(comp.id);}} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:6,color:'white',cursor:'pointer',padding:6}}><Trash2 size={13}/></button>}
          {expanded?<ChevronUp size={16} color="white"/>:<ChevronDown size={16} color="white"/>}
        </div>
      </div>
      {expanded&&(
        <div style={{padding:'16px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            <div className="field"><label>Usage at (body part)</label><input value={comp.usageAt} onChange={e=>setComp(comp.id,'usageAt',e.target.value)} placeholder="e.g. Main fabric, hip and knee pad"/></div>
            <div className="field"><label>Fabric Description</label><input value={comp.fabricDescription} onChange={e=>setComp(comp.id,'fabricDescription',e.target.value)} placeholder="e.g. Warp Knit Interlock"/></div>
            <div className="field"><label>Fabric Code</label><input value={comp.fabricCode} onChange={e=>setComp(comp.id,'fabricCode',e.target.value)}/></div>
            <div className="field"><label>Supplier</label><input value={comp.supplier} onChange={e=>setComp(comp.id,'supplier',e.target.value)}/></div>
            <div className="field"><label>GSM</label><input type="number" value={comp.gsm} onChange={e=>setComp(comp.id,'gsm',e.target.value)}/></div>
            <div className="field">
  <label>Fabric Width</label>
  <div style={{ display: 'flex', gap: 8 }}>
    <input
      type="number"
      value={comp.fabricWidth}
      onChange={e => setComp(comp.id, 'fabricWidth', e.target.value)}
      placeholder={comp.widthUnit === 'cm' ? 'e.g. 152' : 'e.g. 60'}
      style={{ flex: 1 }}
    />
    <select
      value={comp.widthUnit || 'inch'}
      onChange={e => setComp(comp.id, 'widthUnit', e.target.value)}
      style={{ width: 90 }}
    >
      <option value="inch">inch</option>
      <option value="cm">cm</option>
    </select>
  </div>
</div>
            <div className="field"><label>UOM</label>
              <select value={comp.uom} onChange={e=>setComp(comp.id,'uom',e.target.value)}>
                <option value="KG">KG</option><option value="YARD">YARD</option><option value="METER">METER</option>
              </select>
            </div>
            <div className="field"><label>Allowance % (shrinkage, roll etc.)</label><input type="number" step="0.1" value={comp.allowancePct} onChange={e=>setComp(comp.id,'allowancePct',e.target.value)}/></div>
          </div>

          {/* Per-size data */}
          <div style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Per-size values</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {sizes.map(s=>{
              const sd   = getSizeData(comp,s.id);
              const calc = calcForSize(comp,s.id);
              const gsm = parseFloat(comp.gsm) || 0;
          const widthInches =
            comp.widthUnit === 'cm'
              ? cmToInch(parseFloat(comp.fabricWidth) || 0)
              : parseFloat(comp.fabricWidth) || 0;

let displayConsumption = calc.consumption;

if (comp.uom === 'METER') {
  displayConsumption = calcKgToMeter({
    weightKg: calc.consumption,
    gsm,
    widthInches
  });
}

if (comp.uom === 'YARD') {
  const meters = calcKgToMeter({
    weightKg: calc.consumption,
    gsm,
    widthInches
  });

  displayConsumption = metersToYards(meters);
}
              const isBase = baseSizeId===s.id;
              const isAuto = sd.mode==='auto'&&baseSizeId&&!isBase;
              return(
                <div key={s.id} style={{padding:'10px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border-light)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontWeight:700,fontSize:13}}>{s.label}{isBase&&<span style={{fontSize:10,color:'var(--teal)',marginLeft:6}}>(BASE)</span>}</span>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {!isBase&&baseSizeId&&(
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={()=>setSizeData(comp.id,s.id,'mode','manual')} className={'btn btn-sm '+(sd.mode!=='auto'?'btn-primary':'btn-secondary')} style={{padding:'3px 8px',fontSize:10}}>Manual</button>
                          <button onClick={()=>setSizeData(comp.id,s.id,'mode','auto')} className={'btn btn-sm '+(sd.mode==='auto'?'btn-primary':'btn-secondary')} style={{padding:'3px 8px',fontSize:10}}>Auto-scale</button>
                        </div>
                      )}
                      <span style={{fontWeight:700,fontFamily:'JetBrains Mono',color:'var(--teal)',fontSize:15}}>{displayConsumption.toFixed(3)} {comp.uom}</span>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                    {isAuto?(
                      <>
                        <div><label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:3}}>Ratio vs base</label><input type="number" step="0.01" value={sd.ratio??1.0} onChange={e=>setSizeData(comp.id,s.id,'ratio',parseFloat(e.target.value)||1)} style={{fontSize:12,padding:'6px 8px'}}/></div>
                        <div><label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:3}}>Lay (auto-calc)</label><div style={{padding:'6px 8px',background:'white',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'JetBrains Mono',textAlign:'center'}}>{calc.layLength}</div></div>
                        <div><label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:3}}>No of Pcs</label><input type="number" value={sd.noOfPcs??4} onChange={e=>setSizeData(comp.id,s.id,'noOfPcs',parseFloat(e.target.value)||0)} style={{fontSize:12,padding:'6px 8px'}}/></div>
                      </>
                    ):(
                      <>
                        <div><label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:3}}>Lay Length (m)</label><input type="number" step="0.01" value={sd.layLength??0} onChange={e=>setSizeData(comp.id,s.id,'layLength',parseFloat(e.target.value)||0)} style={{fontSize:12,padding:'6px 8px'}}/></div>
                        <div><label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:3}}>No of Pcs</label><input type="number" value={sd.noOfPcs??4} onChange={e=>setSizeData(comp.id,s.id,'noOfPcs',parseFloat(e.target.value)||0)} style={{fontSize:12,padding:'6px 8px'}}/></div>
                        <div><label style={{fontSize:10,color:'var(--text-muted)',display:'block',marginBottom:3}}>Efficiency %</label><input type="number" value={sd.efficiency??70} onChange={e=>setSizeData(comp.id,s.id,'efficiency',parseFloat(e.target.value)||0)} style={{fontSize:12,padding:'6px 8px'}}/></div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3 — KG <-> METER CONVERTER (corrected formulas)
// ════════════════════════════════════════════════════════════
function ConverterTab() {
  const [mode,          setMode]          = useState('kg');
  const [value,         setValue]         = useState('');
  const [gsmVal,        setGsmVal]        = useState('');
  const [width,         setWidth]         = useState('');
  const [widthUnit,     setWidthUnit]     = useState('inch');
  const [outputUnit,    setOutputUnit]    = useState('M');
  const [result,        setResult]        = useState(null);
  const [showHow,       setShowHow]       = useState(false);

  const calculate = () => {
    const v      = parseFloat(value)  || 0;
    const g      = parseFloat(gsmVal) || 0;
    const w      = parseFloat(width)  || 0;
    const wInch  = widthUnit === 'cm' ? w / 2.54 : w;

    if (!v || !g || !w) { setResult({ error: 'Please fill all fields' }); return; }

    if (mode === 'kg') {
      const meters = calcKgToMeter({ weightKg: v, gsm: g, widthInches: wInch });
      const yards  = metersToYards(meters);
      if (outputUnit === 'M') setResult({ value: meters, unit: 'meters', also: yards + ' yards' });
      else if (outputUnit === 'Y') setResult({ value: yards, unit: 'yards', also: meters + ' meters' });
      else setResult({ value: v, unit: 'kg (input)' });
    } else {
      const kg = calcMeterToKg({ lengthM: v, gsm: g, widthInches: wInch });
      if (outputUnit === 'K') setResult({ value: kg, unit: 'kg', also: null });
      else if (outputUnit === 'M') setResult({ value: v, unit: 'meters (input)', also: null });
      else if (outputUnit === 'Y') setResult({ value: metersToYards(v), unit: 'yards', also: kg + ' kg' });
      else setResult({ value: kg, unit: 'kg', also: null });
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Weight / Length</h3>

        <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: mode === 'kg' ? 600 : 400 }}>
            <input type="radio" checked={mode === 'kg'} onChange={() => { setMode('kg'); setResult(null); }} /> Enter weight (kg)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: mode === 'm' ? 600 : 400 }}>
            <input type="radio" checked={mode === 'm'} onChange={() => { setMode('m'); setResult(null); }} /> Enter length (meters)
          </label>
        </div>

        <div className="field">
          <label>{mode === 'kg' ? 'Weight (kg)' : 'Length (meters)'}</label>
          <input type="number" step="0.001" value={value} onChange={e => setValue(e.target.value)} placeholder={mode === 'kg' ? 'e.g. 2.5' : 'e.g. 100'} />
        </div>

        <div className="field"><label>GSM (g/m\u00B2)</label><input type="number" value={gsmVal} onChange={e => setGsmVal(e.target.value)} placeholder="e.g. 215" /></div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Width</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="number" step="0.1" value={width} onChange={e => setWidth(e.target.value)} placeholder={widthUnit === 'inch' ? 'e.g. 60' : 'e.g. 152'} style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={widthUnit === 'inch'} onChange={() => setWidthUnit('inch')} /> inch
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={widthUnit === 'cm'} onChange={() => setWidthUnit('cm')} /> cm
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Output Unit</label>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['M', 'Meters'], ['K', 'Kilograms'], ['Y', 'Yards']].map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={outputUnit === v} onChange={() => setOutputUnit(v)} />
                <strong>{v}</strong> ({l})
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={calculate} style={{ padding: '12px', fontSize: 15, borderRadius: 10 }}>
          Calculate
        </button>

        {result && (
          <div style={{ marginTop: 16 }}>
            {result.error ? (
              <div style={{ padding: '12px', background: 'var(--red-light)', borderRadius: 8, color: 'var(--red)', fontSize: 13 }}>{result.error}</div>
            ) : (
              <div style={{ padding: '18px', background: 'var(--teal-light)', borderRadius: 10, textAlign: 'center', border: '1px solid var(--teal)' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>{result.value}</div>
                <div style={{ fontSize: 13, color: 'var(--teal)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{result.unit}</div>
                {result.also && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Also: {result.also}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div onClick={() => setShowHow(!showHow)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <h3>How to use</h3>
          {showHow ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {showHow && (
          <div style={{ marginTop: 12 }}>
            <ul style={{ paddingLeft: 18, marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <li>Select whether you are entering weight (kg) or length (meters)</li>
              <li>Enter the GSM of the fabric</li>
              <li>Enter the fabric width in inches or cm</li>
              <li>Select your desired output unit (M, K, or Y)</li>
              <li>Tap Calculate</li>
            </ul>
            <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 2 }}>
              <div><strong>Kg \u2192 Meters:</strong> 39370.08 \u00D7 kg \u00F7 (GSM \u00D7 width\u2033)</div>
              <div><strong>Meters \u2192 Kg:</strong> 0.00000254 \u00D7 m \u00D7 GSM \u00D7 width\u2033</div>
              <div><strong>Meters \u2192 Yards:</strong> meters \u00D7 1.09361</div>
            </div>
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              Width in cm is automatically converted to inches (divide by 2.54).
              1 inch = 2.54 cm. Formulas use width in inches directly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
          }
