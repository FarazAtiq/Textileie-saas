import { useCallback, useRef, useState } from 'react';
import { Save, X } from 'lucide-react';
import { createThread, updateThread, findThreadByCode } from '../../lib/db.js';
import { validateThreadForm, duplicateMessage, normalizeCode } from '../../lib/validation.js';
import { useLiveDuplicateCheck } from '../../hooks/useLiveDuplicateCheck.js';
import DuplicateStatus from '../common/DuplicateStatus.jsx';

const blankThread = () => ({
  thread_code: '',
  thread_name: '',
  material: '',
  thread_use: 'Needle',
  ticket_no: '',
  tex: '',
  denier: '',
  supplier: '',
  price: '',
  price_unit: 'Meter',
  currency: 'USD',
  cone_length: '',
  cone_weight: '',
  color: '',
  status: 'Active',
  notes: '',
});

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 13, marginBottom: 10, color: 'var(--navy)' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

export default function ThreadForm({ editing, onCancel, onSaved, toast }) {
  const [form, setForm] = useState(editing ? { ...blankThread(), ...editing } : blankThread());
  const [saving, setSaving] = useState(false);
  const codeRef = useRef(null);
  const checkCode = useCallback((value, excludeId) => findThreadByCode(normalizeCode(value), excludeId), []);
  const duplicateState = useLiveDuplicateCheck({ value: form.thread_code, excludeId: editing?.id, check: checkCode });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    const errors = validateThreadForm(form);
    if (errors.length) { codeRef.current?.focus(); return toast(errors[0], 'error'); }
    if (duplicateState.checking) return toast('Please wait while duplicate checking finishes', 'error');
    if (duplicateState.duplicate) { codeRef.current?.focus(); return toast(duplicateMessage({ entity: 'Thread code', code: normalizeCode(form.thread_code), existing: duplicateState.duplicate }), 'error'); }

    setSaving(true);
    try {
      const duplicate = await findThreadByCode(normalizeCode(form.thread_code), editing?.id || null);
      if (duplicate) {
        toast(duplicateMessage({ entity: 'Thread code', code: normalizeCode(form.thread_code), existing: duplicate }), 'error');
        return;
      }
      if (editing?.id) {
        await updateThread(editing.id, { ...form, thread_code: normalizeCode(form.thread_code) });
        toast('Thread updated');
      } else {
        await createThread({ ...form, thread_code: normalizeCode(form.thread_code) });
        toast('Thread created');
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
        <h3>{editing ? 'Edit Thread' : 'Create Thread'}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          <X size={13} /> Close
        </button>
      </div>

      <Section title="General Information">
        <div className="field"><label>Thread Code *</label><input ref={codeRef} value={form.thread_code} onChange={e => set('thread_code', e.target.value.toUpperCase())} onBlur={() => set('thread_code', normalizeCode(form.thread_code))} placeholder="TH-001" /><DuplicateStatus checking={duplicateState.checking} duplicate={duplicateState.duplicate} error={duplicateState.error} availableText="Thread code is available" duplicateTitle="Thread code already exists" details={duplicateState.duplicate ? `${duplicateState.duplicate.thread_code} - ${duplicateState.duplicate.thread_name || 'Existing thread'}` : ''} /></div>
        <div className="field"><label>Thread Name *</label><input value={form.thread_name} onChange={e => set('thread_name', e.target.value)} placeholder="Polyester 120T" /></div>

        <div className="field">
          <label>Material</label>
          <select value={form.material} onChange={e => set('material', e.target.value)}>
            <option value="">Select material</option>
            <option value="Polyester">Polyester</option>
            <option value="Cotton">Cotton</option>
            <option value="Nylon">Nylon</option>
            <option value="Core Spun">Core Spun</option>
            <option value="Spandex">Spandex</option>
            <option value="Rayon">Rayon</option>
          </select>
        </div>

        <div className="field">
          <label>Thread Use</label>
          <select value={form.thread_use} onChange={e => set('thread_use', e.target.value)}>
            <option value="Needle">Needle</option>
            <option value="Looper">Looper</option>
            <option value="Cover">Cover</option>
            <option value="Embroidery">Embroidery</option>
            <option value="Elastic">Elastic</option>
            <option value="General">General</option>
          </select>
        </div>
      </Section>

      <Section title="Technical Information">
        <div className="field"><label>Ticket No</label><input value={form.ticket_no} onChange={e => set('ticket_no', e.target.value)} placeholder="120" /></div>
        <div className="field"><label>Tex</label><input value={form.tex} onChange={e => set('tex', e.target.value)} placeholder="27" /></div>
        <div className="field"><label>Denier</label><input value={form.denier} onChange={e => set('denier', e.target.value)} placeholder="150D" /></div>
        <div className="field"><label>Color</label><input value={form.color} onChange={e => set('color', e.target.value)} placeholder="Black" /></div>
      </Section>

      <Section title="Commercial Information">
        <div className="field"><label>Supplier</label><input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Coats / Local Supplier" /></div>
        <div className="field"><label>Price</label><input type="number" step="0.0001" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.0015" /></div>

        <div className="field">
          <label>Price Unit</label>
          <select value={form.price_unit} onChange={e => set('price_unit', e.target.value)}>
            <option value="Meter">Meter</option>
            <option value="Cone">Cone</option>
            <option value="KG">KG</option>
          </select>
        </div>

        <div className="field">
          <label>Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}>
            <option value="USD">USD</option>
            <option value="PKR">PKR</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
            <option value="INR">INR</option>
          </select>
        </div>
      </Section>

      <Section title="Package Information">
        <div className="field"><label>Cone Length (m)</label><input type="number" value={form.cone_length} onChange={e => set('cone_length', e.target.value)} placeholder="5000" /></div>
        <div className="field"><label>Cone Weight (kg)</label><input type="number" step="0.001" value={form.cone_weight} onChange={e => set('cone_weight', e.target.value)} placeholder="0.5" /></div>

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
          <label>Notes</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" disabled={saving || duplicateState.checking || !!duplicateState.duplicate} onClick={save}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save Thread'}
        </button>
      </div>
    </div>
  );
                                                   }
