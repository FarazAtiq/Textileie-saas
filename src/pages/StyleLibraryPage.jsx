import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Edit3, Search, Shirt, Palette, Ruler, X } from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { createStyle, deleteStyle, getStyles, updateStyle } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

const DEFAULT_SIZES = [
  { size_name: 'S', ratio: 1, scale_pct: -4 },
  { size_name: 'M', ratio: 2, scale_pct: -2 },
  { size_name: 'L', ratio: 2, scale_pct: 0 },
  { size_name: 'XL', ratio: 1, scale_pct: 3 },
  { size_name: 'XXL', ratio: 1, scale_pct: 6 },
];
const DEFAULT_COLORS = [{ color_name: 'Black', color_code: '', buyer_color_code: '', pantone: '', status: 'Active' }];

const blankForm = () => ({
  article_number: '', style_name: '', buyer: '', season: '', garment_type: 'T-Shirt',
  base_size: 'L', costing_mode: 'base_size',brand: '',
product_category: '',
costing_method: 'FOB',
description: '', status: 'development', notes: '',
  colors: DEFAULT_COLORS.map(x => ({ ...x })),
  sizes: DEFAULT_SIZES.map(x => ({ ...x })),
});

function StyleForm({ editing, onCancel, onSaved }) {
  const [form, setForm] = useState(editing ? {
    ...editing,
    colors: (editing.style_colors || []).map(c => ({ color_name: c.color_name, color_code: c.color_code, order_qty: c.order_qty })),
    sizes: (editing.style_sizes || []).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(s => ({ size_name: s.size_name, ratio: s.ratio, scale_pct: s.scale_pct }))
  } : blankForm());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setColor = (idx, k, v) => setForm(prev => ({ ...prev, colors: prev.colors.map((c, i) => i === idx ? { ...c, [k]: v } : c) }));
  const setSize = (idx, k, v) => setForm(prev => ({ ...prev, sizes: prev.sizes.map((s, i) => i === idx ? { ...s, [k]: v } : s) }));

  const addColor = () => setForm(prev => ({
  ...prev,
  colors: [...prev.colors, { color_name: '', color_code: '', buyer_color_code: '', pantone: '', status: 'Active' }]
}));
  const removeColor = (idx) => setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
  const addSize = () => setForm(prev => ({ ...prev, sizes: [...prev.sizes, { size_name: '', ratio: 1, scale_pct: 0 }] }));
  const removeSize = (idx) => setForm(prev => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== idx) }));
const save = async () => {
  if (!form.article_number.trim()) {
    toast('Article number is required', 'error');
    return;
  }

  setSaving(true);
  try {
    if (editing?.id) {
      await updateStyle(editing.id, form);
      toast('Style updated');
    } else {
      await createStyle(form);
      toast('Style created');
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
        <h3>{editing ? 'Edit Style / Article' : 'Create Style / Article'}</h3>
        {onCancel && <button className="btn btn-secondary btn-sm" onClick={onCancel}><X size={13}/> Close</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="field"><label>Article #</label><input value={form.article_number} onChange={e => set('article_number', e.target.value)} placeholder="4210" /></div>
        <div className="field"><label>Style name</label><input value={form.style_name} onChange={e => set('style_name', e.target.value)} placeholder="Basic polo" /></div>
        <div className="field"><label>Buyer</label><input value={form.buyer} onChange={e => set('buyer', e.target.value)} placeholder="Buyer name" /></div>
        <div className="field"><label>Brand</label><input value={form.brand || ''} onChange={e => set('brand', e.target.value)} placeholder="Nike" /></div>
        <div className="field"><label>Product Category</label><input value={form.product_category || ''} onChange={e => set('product_category', e.target.value)} placeholder="Knit / Woven / Denim" /></div>
        <div className="field"><label>Costing Method</label><select value={form.costing_method || 'FOB'} onChange={e => set('costing_method', e.target.value)}><option value="FOB">FOB</option><option value="CMT">CMT</option></select></div>
        <div className="field"><label>Description</label><input value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Short style description" /></div>
        <div className="field"><label>Season</label><input value={form.season} onChange={e => set('season', e.target.value)} placeholder="SS27" /></div>
        <div className="field"><label>Garment type</label><input value={form.garment_type} onChange={e => set('garment_type', e.target.value)} placeholder="T-Shirt" /></div>
        <div className="field"><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}><option value="development">Development</option><option value="approved">Approved</option><option value="production">Production</option><option value="closed">Closed</option></select></div>
        <div className="field"><label>Base size</label><input value={form.base_size} onChange={e => set('base_size', e.target.value)} placeholder="L" /></div>
        <div className="field"><label>Costing mode</label><select value={form.costing_mode} onChange={e => set('costing_mode', e.target.value)}><option value="base_size">Base size costing</option><option value="size_wise">Size-wise costing</option></select></div>
        <div className="field"><label>Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 12, background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><h3 style={{ fontSize: 13 }}><Palette size={14}/> Colors</h3><button className="btn btn-secondary btn-sm" onClick={addColor}><Plus size={12}/> Add</button></div>
          {form.colors.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 36px', gap: 8, marginBottom: 8 }}>
              <input value={c.color_name} onChange={e => setColor(i, 'color_name', e.target.value)} placeholder="Color" />
              <input value={c.buyer_color_code || ''} onChange={e => setColor(i, 'buyer_color_code', e.target.value)} placeholder="Buyer code" />
              <input value={c.pantone || ''} onChange={e => setColor(i, 'pantone', e.target.value)} placeholder="Pantone" />
              <select value={c.status || 'Active'} onChange={e => setColor(i, 'status', e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button className="btn btn-danger btn-sm" onClick={() => removeColor(i)}><Trash2 size={12}/></button>
</div>
          ))}
        </div>

        <div className="card" style={{ padding: 12, background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><h3 style={{ fontSize: 13 }}><Ruler size={14}/> Size set</h3><button className="btn btn-secondary btn-sm" onClick={addSize}><Plus size={12}/> Add</button></div>
          {form.sizes.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 36px', gap: 8, marginBottom: 8 }}>
              <input value={s.size_name} onChange={e => setSize(i, 'size_name', e.target.value)} placeholder="Size" />
              <input type="number" value={s.ratio} onChange={e => setSize(i, 'ratio', parseFloat(e.target.value) || 0)} placeholder="Ratio" />
              <input type="number" value={s.scale_pct} onChange={e => setSize(i, 'scale_pct', parseFloat(e.target.value) || 0)} placeholder="Scale %" />
              <button className="btn btn-danger btn-sm" onClick={() => removeSize(i)}><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="btn btn-primary" disabled={saving} onClick={save}><Save size={14}/> {saving ? 'Saving...' : 'Save Style'}</button>
      </div>
    </div>
  );
}
function getCompletion(style) {
  const modules = style.style_cost_modules || [];

  const hasSMV = modules.some(m => m.module_type === 'smv');
  const hasFabric = modules.some(m => m.module_type === 'fabric_bom');
  const hasThread = modules.some(m => m.module_type === 'thread');
  const hasAccessories = modules.some(m => m.module_type === 'accessories');
  const hasCosting = modules.some(m => m.module_type === 'costing');

  const items = [
    { label: 'SMV', done: hasSMV },
    { label: 'Fabric', done: hasFabric },
    { label: 'Thread', done: hasThread },
    { label: 'Accessories', done: hasAccessories },
    { label: 'Costing', done: hasCosting },
  ];

  const percent = Math.round((items.filter(x => x.done).length / items.length) * 100);

  return { items, percent };
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PK');
}
export default function StyleLibraryPage() {
  const [styles, setStyles] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try { setStyles(await getStyles({ search })); }
    catch (err) { toast('Failed to load styles: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => styles.filter(s => {
    const q = search.toLowerCase();
    return !q || [s.article_number, s.style_name, s.buyer, s.garment_type].join(' ').toLowerCase().includes(q);
  }), [styles, search]);

  const remove = async (id) => {
    if (!confirm('Delete this style/article? This also removes linked colors, sizes and style modules.')) return;
    try { await deleteStyle(id); setStyles(prev => prev.filter(s => s.id !== id)); toast('Style deleted'); }
    catch (err) { toast('Delete failed: ' + err.message, 'error'); }
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };
 const saved = async () => { closeForm(); await load(); };

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Style Master" subtitle="Industrial Engineering Workspace — create a style once and use it across SMV, Fabric BOM, Thread, Costing, Efficiency, Capacity and Reports" badge={{ text: 'IE Workspace' }} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search article, buyer, style..." style={{ paddingLeft: 32, width: '100%' }} />
        </div>
        <button className="btn btn-secondary" onClick={load}>Search</button>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14}/> New Style</button>
      </div>

      {showForm && <StyleForm editing={editing} onCancel={closeForm} onSaved={saved} />}

      {loading ? <div className="empty-state"><p>Loading styles...</p></div> : filtered.length === 0 ? (
        <div className="empty-state"><Shirt size={32} color="var(--border)"/><p>No styles yet. Create your first article.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(s => {
  const colors = s.style_colors || [];
  const sizes = s.style_sizes || [];

  const statusColor = {
    development: '#f59e0b',
    approved: '#2563eb',
    production: '#16a34a',
    closed: '#111827'
  }[s.status] || '#64748b';

  return (
    <div key={s.id} className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'var(--navy)', fontSize: 18 }}>
            {s.article_number}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
            {s.style_name || s.garment_type || 'Style'}
          </div>
        </div>

        <span style={{
          background: statusColor,
          color: 'white',
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          height: 24,
          textTransform: 'capitalize'
        }}>
          {s.status || 'development'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 14 }}>
        <div><b>Buyer:</b> {s.buyer || '—'}</div>
        <div><b>Brand:</b> {s.brand || '—'}</div>
        <div><b>Category:</b> {s.product_category || '—'}</div>
        <div><b>Garment:</b> {s.garment_type || '—'}</div>
        <div><b>Season:</b> {s.season || '—'}</div>
        <div><b>Base Size:</b> {s.base_size || '—'}</div>
        <div><b>Costing:</b> {s.costing_method || 'FOB'}</div>
        <div><b>Strategy:</b> {s.costing_mode === 'size_wise' ? 'Size-wise' : 'Base size'}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
          COLORS
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {colors.length ? colors.map(c => (
            <span key={c.id || c.color_name} style={{
              background: 'var(--teal-light)',
              color: 'var(--teal)',
              padding: '4px 9px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700
            }}>
              ● {c.color_name}
            </span>
          )) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No colors</span>}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
          SIZES
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sizes.length ? sizes.map(sz => (
            <span key={sz.id || sz.size_name} style={{
              background: 'var(--bg)',
              border: '1px solid var(--border-light)',
              padding: '4px 9px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700
            }}>
              {sz.size_name}
            </span>
          )) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No sizes</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(s); setShowForm(true); }}>
          <Edit3 size={12}/> Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>
          <Trash2 size={12}/> Delete
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
