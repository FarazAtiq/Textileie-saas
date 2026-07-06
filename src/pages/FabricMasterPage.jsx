import MasterStats from '../components/master/MasterStats.jsx';
import MasterSearchBar from '../components/master/MasterSearchBar.jsx';
import StatusBadge from '../components/master/StatusBadge.jsx';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Edit3, Search, X, Layers } from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { getFabrics, createFabric, updateFabric, deleteFabric } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';


const blankFabric = () => ({
  fabric_code: '',
  fabric_name: '',
  description: '',
  composition: '',
  fabric_type: '',
  fabric_category: '',
  supplier_fabric_code: '',
  fabric_form: 'Open Width',
  color_type: 'Solid',
  shrinkage_length_pct: '',
  shrinkage_width_pct: '',
  image_url: '',
  gsm: '',
  finished_width: '',
  cuttable_width: '',
  width_unit: 'inch',
  supplier: '',
  price_unit: 'KG',
  price: '',
  currency: 'USD',
  lead_time_days: '',
  moq: '',
  storage_location: '',
  status: 'Active',
  notes: '',
});

function FabricForm({ editing, onCancel, onSaved }) {
  const [form, setForm] = useState(editing ? { ...blankFabric(), ...editing } : blankFabric());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.fabric_code.trim()) {
      toast('Fabric code is required', 'error');
      return;
    }
  if (!form.fabric_name.trim()) {
  toast('Fabric name is required', 'error');
  return;
}

if ((Number(form.gsm) || 0) <= 0) {
  toast('GSM must be greater than 0', 'error');
  return;
}

if ((Number(form.cuttable_width) || 0) <= 0) {
  toast('Cuttable width must be greater than 0', 'error');
  return;
}

if ((Number(form.price) || 0) < 0) {
  toast('Price cannot be negative', 'error');
  return;
}
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
    <div className="card" style={{ padding: 16, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3>{editing ? 'Edit Fabric' : 'Create Fabric'}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          <X size={13} /> Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="field"><label>Fabric Code *</label><input value={form.fabric_code} onChange={e => set('fabric_code', e.target.value)} placeholder="F001" /></div>
        <div className="field"><label>Fabric Name</label><input value={form.fabric_name} onChange={e => set('fabric_name', e.target.value)} placeholder="Cotton Interlock" /></div>
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
        <div className="field"><label>Supplier</label><input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Lucky Textile" /></div>
        <div className="field">
          <label>Supplier Fabric Code</label>
          <input value={form.supplier_fabric_code || ''} onChange={e => set('supplier_fabric_code', e.target.value)} placeholder="Supplier code" />
        </div>
        <div className="field"><label>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Interlock 180 GSM" /></div>
        <div className="field"><label>Composition</label><input value={form.composition} onChange={e => set('composition', e.target.value)} placeholder="100% Cotton" /></div>
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
        <div className="field"><label>GSM</label><input type="number" value={form.gsm} onChange={e => set('gsm', e.target.value)} placeholder="180" /></div>

        <div className="field"><label>Finished Width</label><input type="number" value={form.finished_width} onChange={e => set('finished_width', e.target.value)} placeholder="72" /></div>
        <div className="field"><label>Cuttable Width</label><input type="number" value={form.cuttable_width} onChange={e => set('cuttable_width', e.target.value)} placeholder="60" /></div>
        <div className="field"><label>Width Unit</label><select value={form.width_unit} onChange={e => set('width_unit', e.target.value)}><option value="inch">inch</option><option value="cm">cm</option></select></div>
        <div className="field">
          <label>Fabric Form</label>
          <select value={form.fabric_form || 'Open Width'} onChange={e => set('fabric_form', e.target.value)}>
            <option value="Open Width">Open Width</option>
            <option value="Tubular">Tubular</option>
          </select>
        </div>
        
        <div className="field">
          <label>Color Type</label>
          <select value={form.color_type || 'Solid'} onChange={e => set('color_type', e.target.value)}>
            <option value="Solid">Solid</option>
            <option value="Greige">Greige</option>
            <option value="Dyed">Dyed</option>
            <option value="Printed">Printed</option>
            <option value="Yarn Dyed">Yarn Dyed</option>
          </select>
        </div>
        <div className="field"><label>Price</label><input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="3.25" /></div>
        <div className="field"><label>Price Unit</label><select value={form.price_unit} onChange={e => set('price_unit', e.target.value)}><option value="KG">KG</option><option value="METER">METER</option><option value="YARD">YARD</option></select></div>
        <div className="field"><label>Currency</label><select value={form.currency} onChange={e => set('currency', e.target.value)}><option value="USD">USD</option><option value="PKR">PKR</option><option value="EUR">EUR</option></select></div>

        <div className="field"><label>MOQ</label><input type="number" value={form.moq} onChange={e => set('moq', e.target.value)} placeholder="500" /></div>
        <div className="field"><label>Lead Time Days</label><input type="number" value={form.lead_time_days} onChange={e => set('lead_time_days', e.target.value)} placeholder="15" /></div>
        <div className="field">
          <label>Shrinkage Length %</label>
          <input type="number" step="0.1" value={form.shrinkage_length_pct || ''} onChange={e => set('shrinkage_length_pct', e.target.value)} />
        </div>
        
        <div className="field">
          <label>Shrinkage Width %</label>
          <input type="number" step="0.1" value={form.shrinkage_width_pct || ''} onChange={e => set('shrinkage_width_pct', e.target.value)} />
        </div>
        <div className="field"><label>Storage Location</label><input value={form.storage_location} onChange={e => set('storage_location', e.target.value)} placeholder="Fabric Store A" /></div>

        <div className="field"><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
        <div className="field" style={{ gridColumn: 'span 2' }}><label>Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save Fabric'}
        </button>
      </div>
    </div>
  );
}

export default function FabricMasterPage() {
  const [fabrics, setFabrics] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setFabrics(await getFabrics({ search }));
    } catch (err) {
      toast('Failed to load fabrics: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return fabrics.filter(f =>
      !q ||
      [
        f.fabric_code,
        f.fabric_name,
        f.description,
        f.composition,
        f.supplier,
        f.status,
      ].join(' ').toLowerCase().includes(q)
    );
  }, [fabrics, search]);

  const stats = useMemo(() => ({
    total: fabrics.length,
    active: fabrics.filter(f => f.status === 'Active').length,
    inactive: fabrics.filter(f => f.status !== 'Active').length,
  }), [fabrics]);

  const remove = async (id) => {
    if (!confirm('Delete this fabric?')) return;
    try {
      await deleteFabric(id);
      setFabrics(prev => prev.filter(f => f.id !== id));
      toast('Fabric deleted');
    } catch (err) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const saved = async () => {
    closeForm();
    await load();
  };

  return (
    <div>
      <ToastContainer />

      <PageHeader
        title="Fabric Master"
        subtitle="Reusable fabric library for BOM, costing, purchase planning and inventory"
        badge={{ text: 'Master Data' }}
      />

      <MasterStats
        stats={[
        { label: 'TOTAL FABRICS', value: stats.total },
        { label: 'ACTIVE', value: stats.active, color: 'var(--teal)' },
        { label: 'INACTIVE', value: stats.inactive, color: '#dc2626' },
      ]}
    />
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--teal)' }}>{stats.active}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>INACTIVE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#dc2626' }}>{stats.inactive}</div>
        </div>
      
<MasterSearchBar
  search={search}
  setSearch={setSearch}
  onSearch={load}
  onNew={() => {
    setEditing(null);
    setShowForm(true);
  }}
  newLabel="New Fabric"
/>
          

      {showForm && <FabricForm editing={editing} onCancel={closeForm} onSaved={saved} />}

      {loading ? (
        <div className="empty-state"><p>Loading fabrics...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Layers size={32} color="var(--border)" />
          <p>No fabrics yet. Create your first fabric master.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
          {filtered.map(f => {
            const active = f.status === 'Active';
            return (
              <div key={f.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>FABRIC CODE</div>
                    <div style={{ fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'var(--navy)', fontSize: 18 }}>
                      {f.fabric_code}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {f.fabric_name || f.description || 'Fabric'}
                    </div>
                  </div>

                  <span style={{
                    background: active ? '#16a34a' : '#64748b',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    height: 24
                  }}>
                    <StatusBadge status={f.status || 'Active'} />
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 14 }}>
                  <div><b>Supplier:</b> {f.supplier || '—'}</div>
                  <div><b>Composition:</b> {f.composition || '—'}</div>
                  <div><b>GSM:</b> {f.gsm || 0}</div>
                  <div><b>Width:</b> {f.cuttable_width || 0} {f.width_unit || 'inch'}</div>
                  <div><b>Finished:</b> {f.finished_width || 0} {f.width_unit || 'inch'}</div>
                  <div><b>MOQ:</b> {f.moq || 0}</div>
                  <div><b>Lead Time:</b> {f.lead_time_days || 0} days</div>
                  <div><b>Store:</b> {f.storage_location || '—'}</div>
                  <div><b>Type:</b> {f.fabric_type || '—'}</div>
                  <div><b>Category:</b> {f.fabric_category || '—'}</div>
                  <div><b>Supplier Code:</b> {f.supplier_fabric_code || '—'}</div>
                  <div><b>Form:</b> {f.fabric_form || 'Open Width'}</div>
                  <div><b>Color Type:</b> {f.color_type || 'Solid'}</div>
                  <div><b>Shrinkage:</b> L {f.shrinkage_length_pct || 0}% / W {f.shrinkage_width_pct || 0}%</div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--teal-light)',
                  marginBottom: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700 }}>Price</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, color: 'var(--teal)' }}>
                    {f.currency || 'USD'} {Number(f.price || 0).toFixed(2)} / {f.price_unit || 'KG'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{
                    padding: '9px 11px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid var(--border-light)',
                    marginBottom: 12,
                    fontSize: 12
                  }}>
                    <b>Used In:</b> 0 Styles
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(f); setShowForm(true); }}>
                    <Edit3 size={12} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(f.id)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
