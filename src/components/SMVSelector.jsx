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
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.article_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.garment_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, t) => {
    const key = t.garment_type || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  if (templates.length === 0 && !loading) return null;

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 500,
        color: 'var(--text-secondary)', marginBottom: 4
      }}>
        Load from article library
      </label>

      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', border: '1px solid var(--teal)',
          borderRadius: 6, cursor: 'pointer', background: 'var(--teal-light)',
          fontSize: 13, color: 'var(--teal)', fontWeight: 500
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} />
          {loading
            ? 'Loading articles...'
            : selected
            ? `Art# ${selected.article_number || ''} — ${selected.name} (${selected.total_smv} min)`
            : 'Select article number'}
        </div>
        <ChevronDown
          size={14}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: '0.2s', flexShrink: 0
          }}
        />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 9999,
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: 'var(--shadow-md)',
          maxHeight: 300, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--border-light)',
            position: 'relative'
          }}>
            <Search size={13} style={{
              position: 'absolute', left: 22, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)'
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by article number or name..."
              style={{ paddingLeft: 28, fontSize: 12 }}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '16px', fontSize: 13,
                color: 'var(--text-muted)', textAlign: 'center'
              }}>
                No articles found. Save SMV templates first.
              </div>
            ) : (
              Object.entries(grouped).map(([garment, items]) => (
                <div key={garment}>
                  <div style={{
                    padding: '6px 14px', fontSize: 10, fontWeight: 600,
                    color: 'var(--text-muted)', background: 'var(--bg)',
                    textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>
                    {garment}
                  </div>
                  {items.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        onSelect(t);
                        setSelected(t);
                        setOpen(false);
                        setSearch('');
                      }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                        borderBottom: '1px solid var(--border-light)',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <div>
                        {t.article_number && (
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            fontFamily: 'JetBrains Mono',
                            background: 'var(--navy)', color: 'white',
                            padding: '2px 7px', borderRadius: 4, marginRight: 8
                          }}>
                            #{t.article_number}
                          </span>
                        )}
                        <span style={{ fontWeight: 500 }}>{t.name}</span>
                        {t.garment_type && (
                          <span style={{
                            fontSize: 11, color: 'var(--text-muted)', marginLeft: 6
                          }}>
                            {t.garment_type}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--teal)',
                        fontFamily: 'JetBrains Mono', background: 'var(--teal-light)',
                        padding: '3px 8px', borderRadius: 6,
                        flexShrink: 0, marginLeft: 8
                      }}>
                        {t.total_smv} min
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
