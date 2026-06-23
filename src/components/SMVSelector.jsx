import { useState, useEffect } from 'react';
import { getSMVDropdown } from '../lib/db.js';
import { ChevronDown, Clock, Search } from 'lucide-react';

export function SMVSelector({ onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    getSMVDropdown()
      .then(data => setTemplates(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = templates.filter(t =>
    (t.article_number || '').toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (templates.length === 0 && !loading) return null;

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
        Select article number (auto-fill SMV)
      </label>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', border: '2px solid var(--teal)',
          borderRadius: 8, cursor: 'pointer', background: 'var(--teal-light)',
          fontSize: 13, color: 'var(--teal)', fontWeight: 600
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} />
          {loading ? 'Loading...' : selected
            ? 'Art# ' + (selected.article_number || '') + ' — ' + selected.name + ' (' + selected.total_smv + ' min)'
            : 'Select article number...'}
        </div>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 9999,
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: 'var(--shadow-md)',
          maxHeight: 280, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search article number..."
              style={{ paddingLeft: 28, fontSize: 12 }}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                No articles found. Save SMV templates first.
              </div>
            ) : (
              filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelect(t);
                    setSelected(t);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.article_number && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono',
                          background: 'var(--navy)', color: 'white',
                          padding: '2px 8px', borderRadius: 4
                        }}>
                          #{t.article_number}
                        </span>
                      )}
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</span>
                    </div>
                    {t.garment_type && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {t.garment_type}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: 'var(--teal)',
                    fontFamily: 'JetBrains Mono', background: 'var(--teal-light)',
                    padding: '4px 10px', borderRadius: 6, flexShrink: 0, marginLeft: 8
                  }}>
                    {t.total_smv} min
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
