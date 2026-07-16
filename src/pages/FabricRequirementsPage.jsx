import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Database,
  Layers3,
  RefreshCw,
  Search,
  RotateCw,
} from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { useToast } from '../hooks/useToast.jsx';
import {
  getCombinedFabricRequirements,
  getFabricRequirements,
  getSavedFabricConsumptionLibrary,
  syncApprovedFabricRequirements,
} from '../lib/db.js';

function number(value, digits = 3) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function SummaryCard({ label, value, sublabel }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 23,
        fontWeight: 800,
        color: 'var(--navy)',
        marginTop: 4,
        fontFamily: 'JetBrains Mono',
      }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default function FabricRequirementsPage() {
  const { toast, ToastContainer } = useToast();
  const [tab, setTab] = useState('order');
  const [requirements, setRequirements] = useState([]);
  const [combined, setCombined] = useState([]);
  const [library, setLibrary] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [orderRows, combinedRows, libraryRows] = await Promise.all([
        getFabricRequirements({ limit: 300 }),
        getCombinedFabricRequirements(),
        getSavedFabricConsumptionLibrary({ limit: 300 }),
      ]);
      setRequirements(orderRows);
      setCombined(combinedRows);
      setLibrary(libraryRows);
    } catch (error) {
      toast('Failed to load Fabric Requirements: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const syncApprovedOrders = async () => {
    setSyncing(true);
    try {
      const result = await syncApprovedFabricRequirements();
      await load();

      if (result.failed > 0) {
        const firstError = result.errors?.[0];
        toast(
          `${result.generated} requirement sheet(s) generated. ${result.failed} failed. ${firstError?.order_number || ''}: ${firstError?.message || ''}`,
          'error'
        );
      } else {
        toast(`${result.generated} approved Export Order requirement sheet(s) synchronized`);
      }
    } catch (error) {
      toast('Fabric requirement synchronization failed: ' + error.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requirements;

    return requirements.filter(requirement => {
      const lineText = (requirement.fabric_requirement_lines || [])
        .map(line =>
          `${line.po_number} ${line.article_number} ${line.color_name} ${line.fabric_code} ${line.fabric_name}`
        )
        .join(' ');

      return [
        requirement.requirement_number,
        requirement.order_number,
        requirement.buyer,
        lineText,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [requirements, search]);

  const stats = useMemo(() => {
    const lines = requirements.flatMap(
      requirement => requirement.fabric_requirement_lines || []
    );

    return {
      sheets: requirements.length,
      poLines: lines.length,
      materials: new Set(
        lines.map(line =>
          `${line.fabric_code}|${line.fabric_name}|${line.color_code}|${line.uom}`
        )
      ).size,
      totalQuantity: lines.reduce(
        (sum, line) => sum + Number(line.total_requirement || 0),
        0
      ),
    };
  }, [requirements]);

  return (
    <div>
      <ToastContainer />

      <PageHeader
        title="Fabric Requirements"
        subtitle="Automatically generated from approved Export Orders and saved size-wise Fabric BOM consumption."
        badge={{ text: 'MRP' }}
      />

      <div className="fabric-req-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        <SummaryCard label="Requirement Sheets" value={stats.sheets} />
        <SummaryCard label="PO / Color Lines" value={stats.poLines} />
        <SummaryCard label="Combined Materials" value={stats.materials} />
        <SummaryCard
          label="Gross Requirement"
          value={number(stats.totalQuantity)}
          sublabel="mixed units"
        />
      </div>

      <div className="card" style={{ padding: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={tab === 'order' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setTab('order')}
          >
            <ClipboardList size={13} /> Order-wise Sheets
          </button>
          <button
            className={tab === 'combined' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setTab('combined')}
          >
            <Layers3 size={13} /> Combined Requirement
          </button>

          <button
            className={tab === 'library' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setTab('library')}
          >
            <Database size={13} /> Consumption Library
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ position: 'relative', minWidth: 220 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search order, PO, article or fabric..."
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={syncApprovedOrders}
            disabled={syncing}
          >
            <RotateCw size={13} /> {syncing ? 'Generating...' : 'Generate / Sync'}
          </button>

          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading Fabric Requirements...</p>
        </div>
      ) : tab === 'order' ? (
        filtered.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(requirement => {
              const open = Boolean(expanded[requirement.id]);
              const lines = requirement.fabric_requirement_lines || [];
              const orderTotal = lines.reduce(
                (sum, line) => sum + Number(line.total_requirement || 0),
                0
              );

              return (
                <div className="card" key={requirement.id} style={{ padding: 0, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(previous => ({
                        ...previous,
                        [requirement.id]: !open,
                      }))
                    }
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'white',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--navy)' }}>
                        {requirement.requirement_number}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        Export Order {requirement.order_number} | {requirement.buyer || '-'} | {lines.length} lines
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Gross Requirement</div>
                        <div style={{ fontWeight: 800, color: 'var(--teal)' }}>
                          {number(orderTotal)}
                        </div>
                      </div>
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {open && (
                    <div className="data-table-wrap" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <table className="data-table" style={{ minWidth: 1100 }}>
                        <thead>
                          <tr>
                            <th>PO</th>
                            <th>Article</th>
                            <th>Color</th>
                            <th>Component</th>
                            <th>Fabric</th>
                            <th>GSM</th>
                            <th>Width</th>
                            <th>UOM</th>
                            <th>Requirement</th>
                            <th>Required Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map(line => (
                            <tr key={line.id}>
                              <td><strong>{line.po_number}</strong></td>
                              <td>{line.article_number} - {line.style_name}</td>
                              <td>{line.color_name} {line.color_code ? `(${line.color_code})` : ''}</td>
                              <td>{line.component_name}</td>
                              <td>
                                <strong>{line.fabric_code || '-'}</strong>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  {line.fabric_name || ''}
                                </div>
                              </td>
                              <td>{line.gsm || '-'}</td>
                              <td>{line.width ? `${line.width} ${line.width_unit}` : '-'}</td>
                              <td>{line.uom}</td>
                              <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--teal)' }}>
                                {number(line.total_requirement)}
                              </td>
                              <td>{line.required_date || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Layers3 size={34} color="var(--border)" />
            <p>No Fabric Requirement Sheets found. Approve an Export Order to generate one.</p>
          </div>
        )
      ) : tab === 'combined' ? (
        combined.length ? (
          <div className="data-table-wrap card" style={{ padding: 0 }}>
            <table className="data-table" style={{ minWidth: 1050 }}>
              <thead>
                <tr>
                  <th>Fabric</th>
                  <th>Color / Shade</th>
                  <th>Supplier</th>
                  <th>UOM</th>
                  <th>Combined Requirement</th>
                  <th>Required Date</th>
                  <th>PO Contributions</th>
                </tr>
              </thead>
              <tbody>
                {combined.map(item => (
                  <tr key={item.key}>
                    <td>
                      <strong>{item.fabric_code || '-'}</strong>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {item.fabric_name || ''}
                      </div>
                    </td>
                    <td>
                      {item.color_name || '-'}
                      {item.color_code ? ` (${item.color_code})` : ''}
                    </td>
                    <td>{item.supplier || '-'}</td>
                    <td>{item.uom}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--teal)' }}>
                      {number(item.total_requirement)}
                    </td>
                    <td>{item.required_date || '-'}</td>
                    <td>
                      <details>
                        <summary style={{ cursor: 'pointer', color: 'var(--teal)', fontWeight: 700 }}>
                          {item.po_details.length} contribution(s)
                        </summary>
                        <div style={{ marginTop: 7, display: 'grid', gap: 5 }}>
                          {item.po_details.map((detail, index) => (
                            <div key={`${detail.po_number}-${index}`} style={{
                              fontSize: 11,
                              padding: '6px 8px',
                              background: 'var(--bg)',
                              borderRadius: 7,
                            }}>
                              {detail.po_number} | Article {detail.article_number} | {detail.color_name} | {number(detail.quantity)} {item.uom}
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Layers3 size={34} color="var(--border)" />
            <p>No combined fabric requirement is available yet.</p>
          </div>
        )
      ) : (
        library.length ? (
          <div className="data-table-wrap card" style={{ padding: 0 }}>
            <table className="data-table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th>Saved Fabric BOM</th>
                  <th>Article</th>
                  <th>Style</th>
                  <th>Buyer</th>
                  <th>Color</th>
                  <th>Base Size</th>
                  <th>Components</th>
                  <th>Saved Date</th>
                </tr>
              </thead>
              <tbody>
                {library
                  .filter(item => {
                    const q = search.trim().toLowerCase();
                    if (!q) return true;
                    return [
                      item.title,
                      item.article_number,
                      item.style_name,
                      item.buyer,
                      item.color_name,
                    ].join(' ').toLowerCase().includes(q);
                  })
                  .map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.title || 'Fabric BOM'}</strong></td>
                      <td>{item.article_number || '-'}</td>
                      <td>{item.style_name || '-'}</td>
                      <td>{item.buyer || '-'}</td>
                      <td>{item.color_name || 'All colors'}</td>
                      <td>{item.base_size || '-'}</td>
                      <td>{item.components?.length || 0}</td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Database size={34} color="var(--border)" />
            <p>No saved Fabric BOM consumption records found.</p>
          </div>
        )
      )}

      <style>{`
        @media (max-width: 850px) {
          .fabric-req-stats {
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }
        }
        @media (max-width: 520px) {
          .fabric-req-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
