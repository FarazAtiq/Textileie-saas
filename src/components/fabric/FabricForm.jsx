import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { createFabric, updateFabric } from '../../lib/db.js';


const blankFabric = () => ({
  fabric_code: '',
  fabric_name: '',
  fabric_type: '',
  fabric_category: '',
  description: '',
  composition: '',
  gsm: '',
  finished_width: '',
  cuttable_width: '',
  width_unit: 'inch',
  fabric_form: 'Open Width',
  color_type: 'Solid',
  supplier: '',
  supplier_fabric_code: '',
  price: '',
  price_unit: 'KG',
  currency: 'USD',
  moq: '',
  lead_time_days: '',
  shrinkage_length_pct: '',
  shrinkage_width_pct: '',
  storage_location: '',
  image_url: '',
  status: 'Active',
  notes: '',
});

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 13, marginBottom: 10, color: 'var(--navy)' }}>{title}</h3>
      <div style={{ display: 'grid',gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

export default function FabricForm({ editing, onCancel, onSaved, toast }) {
  const [form, setForm] = useState(editing ? { ...blankFabric(), ...editing } : blankFabric());
  const [saving, setSaving] = useState(false);
 

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.fabric_code.trim()) return toast('Fabric code is required', 'error');
    if (!form.fabric_name.trim()) return toast('Fabric name is required', 'error');
    if ((Number(form.gsm) || 0) <= 0) return toast('GSM must be greater than 0', 'error');
    if ((Number(form.cuttable_width) || 0) <= 0) return toast('Cuttable width must be greater than 0', 'error');
    if ((Number(form.price) || 0) < 0) return toast('Price cannot be negative', 'error');

    setSaving(true);
    try {
      if (editing?.id) {
        await updateFabric(editing.id, form);
        toast('Fabric updated');
      } else {
        await createFabric(form);
        toast('Fabric created');
      }
      await onSaved?.();
    } catch (err) {
      toast('Failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ padding: 18, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3>{editing ? 'Edit Fabric' : 'Create Fabric'}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          <X size={13} /> Close
        </button>
      </div>

      <Section title="General Information">
        <div className="field"><label>Fabric Code *</label><input value={form.fabric_code} onChange={e => set('fabric_code', e.target.value)} placeholder="F001" /></div>
        <div className="field"><label>Fabric Name *</label><input value={form.fabric_name} onChange={e => set('fabric_name', e.target.value)} placeholder="Cotton Interlock" /></div>
        <div className="field">
          <label>Fabric Type</label>
          <select value={form.fabric_type || ''} onChange={e => set('fabric_type', e.target.value)}>
            <option value="">Select type</option>
            <option value="Single Jersey">Single Jersey</option>
            <option value="Interlock">Interlock</option>
            <option value="Rib">Rib</option>
            <option value="Fleece">Fleece</option>
            <option value="Pique">Pique</option>
            <option value="French Terry">French Terry</option>
            <option value="Denim">Denim</option>
            <option value="Poplin">Poplin</option>
            <option value="Twill">Twill</option>
          </select>
        </div>

        <div className="field">
          <label>Fabric Category</label>
          <select value={form.fabric_category || ''} onChange={e => set('fabric_category', e.target.value)}>
            <option value="">Select category</option>
            <option value="Main Fabric">Main Fabric</option>
            <option value="Contrast Fabric">Contrast Fabric</option>
            <option value="Lining">Lining</option>
            <option value="Pocketing">Pocketing</option>
            <option value="Rib">Rib</option>
            <option value="Collar">Collar</option>
            <option value="Cuff">Cuff</option>
            <option value="Binding">Binding</option>
          </select>
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}><label>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Interlock 180 GSM" /></div>
      </Section>

      <Section title="Technical Information">
        <div className="field"><label>Composition</label><input value={form.composition} onChange={e => set('composition', e.target.value)} placeholder="100% Cotton" /></div>
        <div className="field"><label>GSM *</label><input type="number" value={form.gsm} onChange={e => set('gsm', e.target.value)} placeholder="180" /></div>
        <div className="field"><label>Finished Width</label><input type="number" value={form.finished_width} onChange={e => set('finished_width', e.target.value)} placeholder="72" /></div>
        <div className="field"><label>Cuttable Width *</label><input type="number" value={form.cuttable_width} onChange={e => set('cuttable_width', e.target.value)} placeholder="60" /></div>
        <div className="field"><label>Width Unit</label><select value={form.width_unit} onChange={e => set('width_unit', e.target.value)}><option value="inch">inch</option><option value="cm">cm</option></select></div>
        <div className="field"><label>Fabric Form</label><select value={form.fabric_form} onChange={e => set('fabric_form', e.target.value)}><option value="Open Width">Open Width</option><option value="Tubular">Tubular</option></select></div>
        <div className="field"><label>Color Type</label><select value={form.color_type} onChange={e => set('color_type', e.target.value)}><option value="Solid">Solid</option><option value="Greige">Greige</option><option value="Dyed">Dyed</option><option value="Printed">Printed</option><option value="Yarn Dyed">Yarn Dyed</option></select></div>
      </Section>

      <Section title="Commercial Information">
        <div className="field"><label>Supplier</label><input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Lucky Textile" /></div>
        <div className="field"><label>Supplier Fabric Code</label><input value={form.supplier_fabric_code} onChange={e => set('supplier_fabric_code', e.target.value)} placeholder="Supplier code" /></div>
        <div className="field"><label>Price</label><input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="3.25" /></div>
        <div className="field"><label>Price Unit</label><select value={form.price_unit} onChange={e => set('price_unit', e.target.value)}><option value="KG">KG</option><option value="METER">METER</option><option value="YARD">YARD</option></select></div>
        <div className="field"><label>Currency</label><select value={form.currency} onChange={e => set('currency', e.target.value)}><option value="USD">USD</option><option value="PKR">PKR</option><option value="EUR">EUR</option><option value="CNY">CNY</option><option value="INR">INR</option></select></div>
        <div className="field"><label>MOQ</label><input type="number" value={form.moq} onChange={e => set('moq', e.target.value)} placeholder="500" /></div>
        <div className="field"><label>Lead Time Days</label><input type="number" value={form.lead_time_days} onChange={e => set('lead_time_days', e.target.value)} placeholder="15" /></div>
      </Section>

      <Section title="Quality & Warehouse">
        <div className="field"><label>Shrinkage Length %</label><input type="number" step="0.1" value={form.shrinkage_length_pct} onChange={e => set('shrinkage_length_pct', e.target.value)} /></div>
        <div className="field"><label>Shrinkage Width %</label><input type="number" step="0.1" value={form.shrinkage_width_pct} onChange={e => set('shrinkage_width_pct', e.target.value)} /></div>
        <div className="field"><label>Storage Location</label><input value={form.storage_location} onChange={e => set('storage_location', e.target.value)} placeholder="Fabric Store A" /></div>
        <div className="field"><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Development">Development</option><option value="Obsolete">Obsolete</option></select></div>
        <div className="field" style={{ gridColumn: 'span 2' }}><label>Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" /></div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save Fabric'}
        </button>
      </div>
    </div>
  );
              }
