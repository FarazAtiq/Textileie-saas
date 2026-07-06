import { Search, Plus } from 'lucide-react';

export default function MasterSearchBar({ search, setSearch, onSearch, onNew, newLabel = 'New' }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ paddingLeft: 32, width: '100%' }} />
      </div>
      <button className="btn btn-secondary" onClick={onSearch}>Search</button>
      <button className="btn btn-primary" onClick={onNew}>
        <Plus size={14} /> {newLabel}
      </button>
    </div>
  );
}
