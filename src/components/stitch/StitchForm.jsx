import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { createStitch, updateStitch } from '../../lib/db.js';

const blankStitch = () => ({
  stitch_code: '',
  stitch_name: '',
  seam_class: '',
  needle_ratio: '',
  looper_ratio: '',
  cover_ratio: '',
  default_spi: '',
  description: '',
  status: 'Active',
});

export default function StitchForm({ editing, onCancel, onSaved, toast }) {
  const [form, setForm] = useState(editing ? { ...blankStitch(), ...editing } : blankStitch());
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.stitch_code.trim()) return toast('Stitch code is required', 'error');
    if (!form.stitch_name.trim()) return toast('Stitch name is required', 'error');

    setSaving(true);
    try {
      if (editing?.id) {
        await updateStitch(editing.id, form);
        toast('Stitch updated');
      } else {
        await createStitch(form);
        toast('Stitch created');
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
        <h3>{editing ? 'Edit Stitch' : 'Create Stitch'}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          <X size={13} /> Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div className="field">
          <label>Stitch Code *</label>
          <input value={form.stitch_code} onChange={e => set('stitch_code', e.target.value)} placeholder="504" />
        </div>

        <div className="field">
          <label>Stitch Name *</label>
          <input value={form.stitch_name} onChange={e => set('stitch_name', e.target.value)} placeholder="Overlock 3T" />
        </div>

        <div className="field">
          <label>Seam Class</label>
          <input value={form.seam_class} onChange={e => set('seam_class', e.target.value)} placeholder="Overlock" />
        </div>

        <div className="field">
          <label>Needle Ratio</label>
          <input type="number" step="0.01" value={form.needle_ratio} onChange={e => set('needle_ratio', e.target.value)} placeholder="4" />
        </div>

        <div className="field">
          <label>Looper Ratio</label>
          <input type="number" step="0.01" value={form.looper_ratio} onChange={e => set('looper_ratio', e.target.value)} placeholder="10" />
        </div>

        <div className="field">
          <label>Cover Ratio</label>
          <input type="number" step="0.01" value={form.cover_ratio} onChange={e => set('cover_ratio', e.target.value)} placeholder="0" />
        </div>

        <div className="field">
          <label>Default SPI</label>
          <input type="number" step="0.1" value={form.default_spi} onChange={e => set('default_spi', e.target.value)} placeholder="12" />
        </div>

        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Development">Development</option>
            <option value="Obsolete">Obsolete</option>
          </select>
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Description</label>
          <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Default ratios for overlock operation" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save Stitch'}
        </button>
      </div>
    </div>
  );
}
