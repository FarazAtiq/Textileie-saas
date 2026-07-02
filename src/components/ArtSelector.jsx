import { useEffect, useMemo, useState } from 'react';
import { getStyleDropdown } from '../lib/db.js';

export function ArticleSelector({ value, colorId, onSelect, label = 'Article / Style' }) {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getStyleDropdown().then(data => { if (mounted) setStyles(data); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const selected = useMemo(() => styles.find(s => s.id === value) || null, [styles, value]);
  const colors = selected?.style_colors || [];

  const handleStyle = (styleId) => {
    const style = styles.find(s => s.id === styleId) || null;
    const firstColor = style?.style_colors?.[0] || null;
    onSelect?.({ style, color: firstColor });
  };

  const handleColor = (cid) => {
    const color = colors.find(c => c.id === cid) || null;
    onSelect?.({ style: selected, color });
  };

  return (
    <div className="card" style={{ padding: 14, marginBottom: 14 }}>
      <h3 style={{ marginBottom: 12, fontSize: 14 }}>Style Link</h3>
      <div className="field">
        <label>{label}</label>
        <select value={value || ''} onChange={e => handleStyle(e.target.value)} disabled={loading}>
          <option value="">{loading ? 'Loading styles...' : 'Select article / style'}</option>
          {styles.map(s => (
            <option key={s.id} value={s.id}>
              {s.article_number || 'No Article'} — {s.style_name || s.garment_type || 'Style'} {s.buyer ? `(${s.buyer})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="field">
          <label>Color</label>
          <select value={colorId || ''} onChange={e => handleColor(e.target.value)}>
            <option value="">No color / common for all colors</option>
            {colors.map(c => <option key={c.id} value={c.id}>{c.color_name} {c.order_qty ? `— ${c.order_qty} pcs` : ''}</option>)}
          </select>
        </div>
      )}

      {selected && (
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '9px 10px', fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><b>Base size:</b> {selected.base_size || 'L'}</div>
          <div><b>Mode:</b> {selected.costing_mode === 'size_wise' ? 'Size-wise' : 'Base size'}</div>
          <div><b>Sizes:</b> {(selected.style_sizes || []).map(s => s.size_name).join(', ') || '—'}</div>
          <div><b>Colors:</b> {(selected.style_colors || []).length || 0}</div>
        </div>
      )}
    </div>
  );
}
