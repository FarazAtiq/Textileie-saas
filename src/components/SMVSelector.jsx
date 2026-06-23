import { useState, useEffect } from 'react';
import { getSMVDropdown } from '../lib/db.js';
import { ChevronDown, Search } from 'lucide-react';

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

  // Only show if we have templates with article numbers
  const withArticle = templates.filter(t => t.article_number && t.article_number.trim() !== '');
  const withoutArticle = templates.filter(t => !t.article_number || t.article_number.trim() === '');

  const filterItems = (list) => list.filter(t =>
    (t.article_number || '').toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (templates.length === 0 && !loading) return null;

  const displayText = () => {
    if (loading) return 'Loading...';
    if (!selected) return 'Select article number to auto-fill SMV';
    const art = selected.article_number;
    return art ? '#' + art + ' — ' + selected.name + ' (' + selected.total_smv + ' min)' : selected.name + ' (' + selected.total_smv + ' min)';
  };

  const handleSelect = (t) => {
    onSelect(t);
    setSelected(t);
    setOpen(false);
    setSearch('');
  };

  const renderItem = (t) => (
    <div
      key={t.id}
      onClick={() => handleSelect(t)}
      style={{
        padding: '10px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--teal-light)'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}
    >
      <div>
        {/* Article number shown BIG and first */}
        {t.article_number ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{
              fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono',
              color: 'var(--navy)'
            }}>
              #{t.article_number}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {t.name}
            </span>
          </div>
        ) : (
          <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {t.garment_type || ''}
        </div>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 700, color: 'white',
        fontFamily: 'JetBrains Mono', background: 'var(--teal)',
        padding: '4px 10px', borderRadius: 6,
        flexShrink: 0, marginLeft: 12
      }}>
        {t.total_smv} min
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 500,
        color: 'var(--text-secondary)', marginBottom: 4
      }}>
        Select article number (auto-fill SMV)
      </label>

      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', border: '2px solid var(--teal)',
          borderRadius: 8, cursor: 'pointer', background: 'var(--teal-light)',
          fontSize: 13, color: 'var(--navy)', fontWeight: 600
        }}
      >
        <span>{displayText()}</span>
        <ChevronDown size={15} style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: '0.2s', flexShrink: 0, color: 'var(--teal)'
        }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 9999,
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: 320, display: 'flex', flexDirection: 'column'
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
            <Search size={13} style={{
              position: 'absolute', left: 22, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)'
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type article number e.g. 4233..."
              style={{ paddingLeft: 30, fontSize: 13 }}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Articles with article number — shown first */}
            {filterItems(withArticle).length > 0 && (
              <>
                <div style={{
                  padding: '6px 16px', fontSize: 10, fontWeight: 700,
                  color: 'var(--text-muted)', background: 'var(--bg)',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  By article number
                </div>
                {filterItems(withArticle).map(t => renderItem(t))}
              </>
            )}

            {/* Articles without article number */}
            {filterItems(withoutArticle).length > 0 && (
              <>
                <div style={{
                  padding: '6px 16px', fontSize: 10, fontWeight: 700,
                  color: 'var(--text-muted)', background: 'var(--bg)',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  Other templates (no article number)
                </div>
                {filterItems(withoutArticle).map(t => renderItem(t))}
              </>
            )}

            {filterItems([...withArticle, ...withoutArticle]).length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No articles found
              </div>
            )}
          </div>

          {/* Footer tip */}
          <div style={{
            padding: '8px 16px', borderTop: '1px solid var(--border-light)',
            fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)'
          }}>
            To add articles: go to SMV/SAM → enter article number → Save to library
          </div>
        </div>
      )}
    </div>
  );
}
