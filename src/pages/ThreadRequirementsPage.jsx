import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Layers3,
  RefreshCw,
  RotateCw,
  Search,
  Scissors,
} from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { useToast } from '../hooks/useToast.jsx';
import {
  getCombinedThreadRequirements,
  getThreadRequirements,
  syncApprovedThreadRequirements,
} from '../lib/db.js';

function number(value, digits = 2) {
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

export default function ThreadRequirementsPage() {
  const { toast, ToastContainer } = useToast();
  const [tab, setTab] = useState('order');
  const [requirements, setRequirements] = useState([]);
  const [combined, setCombined] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [orderRows, combinedRows] = await Promise.all([
        getThreadRequirements({ limit: 300 }),
        getCombinedThreadRequirements(),
      ]);

      setRequirements(orderRows);
      setCombined(combinedRows);
    } catch (error) {
      toast('Failed to load Thread Requirements: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const syncApproved = async () => {
    setSyncing(true);
    try {
      const result = await syncApprovedThreadRequirements();
      await load();

      if (result.failed > 0) {
        const first = result.errors?.[0];
        toast(
          `${result.generated} sheet(s) generated. ${result.failed} failed. ${first?.order_number || ''}: ${first?.message || ''}`,
          'error'
        );
      } else {
        toast(`${result.generated} approved Export Order thread sheet(s) synchronized`);
      }
    } catch (error) {
      toast('Thread requirement synchronization failed: ' + error.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requirements;

    return requirements.filter(requirement => {
      const detailText = (requirement.thread_requirement_lines || [])
        .map(line =>
          `${line.po_number} ${line.article_number} ${line.order_color_name} ${line.thread_code} ${line.thread_name} ${line.thread_color_name}`
        )
        .join(' ');

      return [
        requirement.requirement_number,
        requirement.order_number,
        requirement.buyer,
        detailText,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [requirements, search]);

  const stats = useMemo(() => {
    const lines = requirements.flatMap(
      requirement => requirement.thread_requirement_lines || []
    );

    return {
      sheets: requirements.length,
      lines: lines.length,
      threadCodes: new Set(
        lines.map(line =>
          `${line.thread_code}|${line.thread_color_code || line.thread_color_name}`
        )
      ).size,
      meters: lines.reduce(
        (sum, line) => sum + Number(line.total_meters || 0),
        0
      ),
      cones: lines.reduce(
        (sum, line) => sum + Number(line.required_cones || 0),
        0
      ),
    };
  }, [requirements]);

  return (
    <div>
      <ToastContainer />

      <PageHeader
        title="Thread Requirements"
        subtitle="Automatically calculated from saved Thread Engineering consumption per garment and approved PO quantities."
        badge={{ text: 'MRP' }}
      />

      <div className="thread-req-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        <SummaryCard label="Requirement Sheets" value={stats.sheets} />
        <SummaryCard label="Thread Lines" value={stats.lines} />
        <SummaryCard label="Unique Threads" value={stats.threadCodes} />
        <SummaryCard
          label="Total Requirement"
          value={number(stats.meters)}
          sublabel={`${Math.ceil(stats.cones)} cones from saved cone lengths`}
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
              placeholder="Search order, PO, article or thread..."
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={syncApproved}
            disabled={syncing}
          >
            <RotateCw size={13} />
            {syncing ? 'Generating...' : 'Generate / Sync'}
          </button>

          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading Thread Requirements...</p>
        </div>
      ) : tab === 'order' ? (
        filtered.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(requirement => {
              const open = Boolean(expanded[requirement.id]);
              const lines = requirement.thread_requirement_lines || [];
              const meters = lines.reduce(
                (sum, line) => sum + Number(line.total_meters || 0),
                0
              );
              const cones = lines.reduce(
                (sum, line) => sum + Number(line.required_cones || 0),
                0
              );

              return (
                <div
                  className="card"
                  key={requirement.id}
                  style={{ padding: 0, overflow: 'hidden' }}
                >
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
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 3,
                      }}>
                        Export Order {requirement.order_number} | {requirement.buyer || '-'} | {lines.length} lines
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          Total Thread
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--teal)' }}>
                          {number(meters)} m
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {Math.ceil(cones)} cones
                        </div>
                      </div>
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {open && (
                    <div
                      className="data-table-wrap"
                      style={{ borderTop: '1px solid var(--border-light)' }}
                    >
                      <table className="data-table" style={{ minWidth: 1220 }}>
                        <thead>
                          <tr>
                            <th>PO</th>
                            <th>Article</th>
                            <th>Order Color</th>
                            <th>Thread Code</th>
                            <th>Thread</th>
                            <th>Thread Shade</th>
                            <th>PO Qty</th>
                            <th>Consumption / Garment</th>
                            <th>Total Meters</th>
                            <th>Cone Length</th>
                            <th>Cones</th>
                            <th>Required Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map(line => (
                            <tr key={line.id}>
                              <td><strong>{line.po_number}</strong></td>
                              <td>
                                {line.article_number} - {line.style_name}
                              </td>
                              <td>
                                {line.order_color_name || '-'}
                                {line.order_color_code
                                  ? ` (${line.order_color_code})`
                                  : ''}
                              </td>
                              <td>
                                <strong>{line.thread_code}</strong>
                              </td>
                              <td>
                                {line.thread_name || '-'}
                                <div style={{
                                  fontSize: 10,
                                  color: 'var(--text-muted)',
                                }}>
                                  {line.thread_brand || ''}
                                  {line.ticket_no ? ` | Ticket ${line.ticket_no}` : ''}
                                </div>
                              </td>
                              <td>
                                {line.thread_color_name || line.order_color_name || '-'}
                                {line.thread_color_code
                                  ? ` (${line.thread_color_code})`
                                  : ''}
                              </td>
                              <td>{Number(line.po_quantity || 0).toLocaleString()}</td>
                              <td style={{ fontFamily: 'JetBrains Mono' }}>
                                {number(line.consumption_per_garment, 3)} m
                              </td>
                              <td style={{
                                fontFamily: 'JetBrains Mono',
                                fontWeight: 800,
                                color: 'var(--teal)',
                              }}>
                                {number(line.total_meters)} m
                              </td>
                              <td>
                                {line.cone_length_m
                                  ? `${number(line.cone_length_m, 0)} m`
                                  : '-'}
                              </td>
                              <td>{line.required_cones || '-'}</td>
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
            <Scissors size={34} color="var(--border)" />
            <p>No Thread Requirement Sheets found. Approve an Export Order or click Generate / Sync.</p>
          </div>
        )
      ) : combined.length ? (
        <div className="data-table-wrap card" style={{ padding: 0 }}>
          <table className="data-table" style={{ minWidth: 1120 }}>
            <thead>
              <tr>
                <th>Thread Code</th>
                <th>Thread</th>
                <th>Thread Shade</th>
                <th>Supplier</th>
                <th>Combined Meters</th>
                <th>Cone Length</th>
                <th>Required Cones</th>
                <th>Required Date</th>
                <th>PO Contributions</th>
              </tr>
            </thead>
            <tbody>
              {combined.map(item => (
                <tr key={item.key}>
                  <td><strong>{item.thread_code}</strong></td>
                  <td>
                    {item.thread_name || '-'}
                    <div style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                    }}>
                      {item.thread_brand || ''}
                      {item.ticket_no ? ` | Ticket ${item.ticket_no}` : ''}
                    </div>
                  </td>
                  <td>
                    {item.thread_color_name || '-'}
                    {item.thread_color_code
                      ? ` (${item.thread_color_code})`
                      : ''}
                  </td>
                  <td>{item.supplier || '-'}</td>
                  <td style={{
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 800,
                    color: 'var(--teal)',
                  }}>
                    {number(item.total_meters)} m
                  </td>
                  <td>
                    {item.cone_length_m
                      ? `${number(item.cone_length_m, 0)} m`
                      : '-'}
                  </td>
                  <td>{item.required_cones || '-'}</td>
                  <td>{item.required_date || '-'}</td>
                  <td>
                    <details>
                      <summary style={{
                        cursor: 'pointer',
                        color: 'var(--teal)',
                        fontWeight: 700,
                      }}>
                        {item.po_details.length} contribution(s)
                      </summary>
                      <div style={{ marginTop: 7, display: 'grid', gap: 5 }}>
                        {item.po_details.map((detail, index) => (
                          <div
                            key={`${detail.po_number}-${detail.order_color_code}-${index}`}
                            style={{
                              fontSize: 11,
                              padding: '6px 8px',
                              background: 'var(--bg)',
                              borderRadius: 7,
                            }}
                          >
                            {detail.po_number} | Article {detail.article_number} | {detail.order_color_name} | {Number(detail.po_quantity || 0).toLocaleString()} pcs x {number(detail.consumption_per_garment, 3)} m = {number(detail.total_meters)} m
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
          <p>No combined thread requirement is available yet.</p>
        </div>
      )}

      <style>{`
        @media (max-width: 850px) {
          .thread-req-stats {
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }
        }
        @media (max-width: 520px) {
          .thread-req-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
