import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Eye,
  Filter,
  PackageCheck,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { useToast } from '../hooks/useToast.jsx';
import {
  checkDuplicateExportOrderNumber,
  checkDuplicatePONumbers,
  createExportOrder,
  deleteExportOrder,
  duplicateExportOrder,
  generateExportOrderNumber,
  getExportOrders,
  getStyleCostSummary,
  getStyles,
  updateExportOrder,
  updateExportOrderStatus,
} from '../lib/db.js';

const ORDER_STATUSES = [
  'Draft',
  'Submitted',
  'Approved',
  'In Production',
  'Shipped',
  'Closed',
  'Cancelled',
];

const blankHeader = () => ({
  order_number: '',
  buyer: '',
  brand: '',
  season: '',
  factory_name: '',
  merchandiser: '',
  order_date: new Date().toISOString().slice(0, 10),
  shipment_date: '',
  delivery_date: '',
  currency: 'USD',
  status: 'Draft',
  remarks: '',
});

const makeColor = (sizeTemplate = []) => ({
  local_id: crypto.randomUUID(),
  color_id: '',
  color_code: '',
  color_name: '',
  sizes: sizeTemplate.map(size => ({ ...size, quantity: 0 })),
  readiness: { smv: false, fabric: false, thread: false, accessories: false },
  engineering_status: 'Pending',
});

const makePO = () => ({
  local_id: crypto.randomUUID(),
  po_number: '',
  style_id: '',
  article_number: '',
  style_name: '',
  buyer_style: '',
  garment_type: '',
  size_template: [],
  colors: [],
  total_quantity: 0,
  readiness: { smv: false, fabric: false, thread: false, accessories: false },
  engineering_status: 'Pending',
  expanded: true,
});

function normalized(value) {
  return String(value || '').trim().toUpperCase();
}

function colorTotal(color) {
  return (color?.sizes || []).reduce(
    (sum, size) => sum + Number(size.quantity || 0),
    0
  );
}

function poTotal(po) {
  return (po?.colors || []).reduce(
    (sum, color) => sum + colorTotal(color),
    0
  );
}

function readinessFromModules(modules) {
  return {
    smv: Boolean(modules?.smv),
    fabric: Boolean(modules?.fabric_bom),
    thread: Boolean(modules?.thread),
    accessories: Boolean(modules?.accessories),
  };
}

function isEngineeringReady(readiness) {
  return Boolean(readiness?.smv && readiness?.fabric && readiness?.thread);
}

function aggregateReadiness(colors) {
  const valid = (colors || []).filter(color => color.color_id);
  if (!valid.length) {
    return { smv: false, fabric: false, thread: false, accessories: false };
  }
  return {
    smv: valid.every(color => color.readiness?.smv),
    fabric: valid.every(color => color.readiness?.fabric),
    thread: valid.every(color => color.readiness?.thread),
    accessories: valid.every(color => color.readiness?.accessories),
  };
}

function StatusBadge({ status }) {
  const tones = {
    Draft: ['#F8FAFC', '#475569'],
    Submitted: ['#EFF6FF', '#2563EB'],
    Approved: ['#ECFDF5', '#059669'],
    'In Production': ['#F5F3FF', '#7C3AED'],
    Shipped: ['#ECFEFF', '#0891B2'],
    Closed: ['#E2E8F0', '#0F172A'],
    Cancelled: ['#FEF2F2', '#DC2626'],
  };
  const [background, color] = tones[status] || tones.Draft;
  return (
    <span style={{
      background, color, borderRadius: 20, padding: '4px 9px',
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{status}</span>
  );
}

function ReadinessBadge({ readiness }) {
  const ready = isEngineeringReady(readiness);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700,
      color: ready ? 'var(--green)' : 'var(--amber)',
    }}>
      {ready ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      {ready ? 'Engineering Ready' : 'Engineering Incomplete'}
    </span>
  );
}

function SummaryCard({ label, value, sublabel }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{
        fontSize: 10, color: 'var(--text-muted)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 800, color: 'var(--navy)',
        marginTop: 4, fontFamily: 'JetBrains Mono',
      }}>{value}</div>
      {sublabel && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default function ExportOrdersPage() {
  const { toast, ToastContainer } = useToast();
  const [mode, setMode] = useState('list');
  const [orders, setOrders] = useState([]);
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingOrderNumber, setCheckingOrderNumber] = useState(false);
  const [duplicateOrderNumber, setDuplicateOrderNumber] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [header, setHeader] = useState(blankHeader());
  const [pos, setPos] = useState([makePO()]);
  const orderNumberRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [orderRows, styleRows] = await Promise.all([
        getExportOrders({ limit: 300 }),
        getStyles({ limit: 500 }),
      ]);
      setOrders(orderRows);
      setStyles(styleRows);
    } catch (error) {
      toast('Failed to load Export Orders: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!header.order_number.trim()) {
      setDuplicateOrderNumber(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingOrderNumber(true);
      try {
        const match = await checkDuplicateExportOrderNumber(
          header.order_number,
          editingId
        );
        if (!cancelled) setDuplicateOrderNumber(match);
      } catch (error) {
        if (!cancelled) toast('Order number check failed: ' + error.message, 'error');
      } finally {
        if (!cancelled) setCheckingOrderNumber(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [header.order_number, editingId]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter(order => {
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;

      const poSearch = (order.export_order_pos || [])
        .map(po => {
          const colors = (po.export_order_po_colors || [])
            .map(color => `${color.color_name} ${color.color_code}`)
            .join(' ');
          return `${po.po_number} ${po.article_number} ${colors}`;
        })
        .join(' ');

      return matchesStatus && (
        !query ||
        [order.order_number, order.buyer, order.brand, order.season, poSearch]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    approved: orders.filter(order => order.status === 'Approved').length,
    draft: orders.filter(order => order.status === 'Draft').length,
    quantity: orders.reduce(
      (sum, order) => sum + Number(order.total_quantity || 0),
      0
    ),
  }), [orders]);

  const totalOrderQuantity = useMemo(
    () => pos.reduce((sum, po) => sum + poTotal(po), 0),
    [pos]
  );

  const totalColors = useMemo(
    () => pos.reduce((sum, po) => sum + (po.colors || []).length, 0),
    [pos]
  );

  const allPOsReady =
    pos.length > 0 &&
    pos.every(po => isEngineeringReady(aggregateReadiness(po.colors)));

  const allPOsValid =
    pos.length > 0 &&
    pos.every(po =>
      normalized(po.po_number) &&
      po.style_id &&
      po.colors.length > 0 &&
      po.colors.every(color => color.color_id && colorTotal(color) > 0)
    );

  const resetForm = async () => {
    const number = await generateExportOrderNumber();
    setEditingId(null);
    setHeader({ ...blankHeader(), order_number: number });
    setPos([makePO()]);
    setDuplicateOrderNumber(null);
    setMode('form');
  };

  const closeForm = () => {
    setMode('list');
    setEditingId(null);
    setHeader(blankHeader());
    setPos([makePO()]);
  };

  const editOrder = order => {
    setEditingId(order.id);
    setHeader({
      order_number: order.order_number || '',
      buyer: order.buyer || '',
      brand: order.brand || '',
      season: order.season || '',
      factory_name: order.factory_name || '',
      merchandiser: order.merchandiser || '',
      order_date: order.order_date || '',
      shipment_date: order.shipment_date || '',
      delivery_date: order.delivery_date || '',
      currency: order.currency || 'USD',
      status: order.status || 'Draft',
      remarks: order.remarks || '',
    });

    setPos(
      (order.export_order_pos || [])
        .sort((a, b) => Number(a.sequence_no || 0) - Number(b.sequence_no || 0))
        .map(po => {
          const savedColors = (po.export_order_po_colors || [])
            .sort((a, b) => Number(a.sequence_no || 0) - Number(b.sequence_no || 0))
            .map(color => ({
              local_id: color.id || crypto.randomUUID(),
              color_id: color.color_id || '',
              color_code: color.color_code || '',
              color_name: color.color_name || '',
              sizes: (color.export_order_sizes || [])
                .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
                .map(size => ({
                  size_id: size.size_id || '',
                  size_name: size.size_name,
                  quantity: Number(size.quantity || 0),
                  sort_order: size.sort_order,
                })),
              readiness: color.readiness || {
                smv: false, fabric: false, thread: false, accessories: false,
              },
              engineering_status: color.engineering_status || 'Pending',
            }));

          const sizeTemplate = savedColors[0]?.sizes.map(size => ({
            size_id: size.size_id,
            size_name: size.size_name,
            sort_order: size.sort_order,
          })) || [];

          return {
            local_id: po.id || crypto.randomUUID(),
            po_number: po.po_number || '',
            style_id: po.style_id || '',
            article_number: po.article_number || '',
            style_name: po.style_name || '',
            buyer_style: po.buyer_style || '',
            garment_type: po.garment_type || '',
            size_template: sizeTemplate,
            colors: savedColors,
            total_quantity: Number(po.total_quantity || 0),
            readiness: aggregateReadiness(savedColors),
            engineering_status: po.engineering_status || 'Pending',
            expanded: true,
          };
        })
    );
    setMode('form');
  };

  const updatePO = (localId, patch) => {
    setPos(previous =>
      previous.map(po => po.local_id === localId ? { ...po, ...patch } : po)
    );
  };

  const selectStyle = async (localId, styleId) => {
    const style = styles.find(item => String(item.id) === String(styleId));
    if (!style) {
      updatePO(localId, {
        style_id: '', article_number: '', style_name: '',
        garment_type: '', size_template: [], colors: [],
      });
      return;
    }

    const sizeTemplate = (style.style_sizes || [])
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((size, index) => ({
        size_id: size.id,
        size_name: size.size_name,
        sort_order: Number(size.sort_order ?? index),
      }));

    setHeader(previous => ({
      ...previous,
      buyer: previous.buyer || style.buyer || '',
      brand: previous.brand || style.brand || '',
      season: previous.season || style.season || '',
    }));

    updatePO(localId, {
      style_id: style.id,
      article_number: style.article_number || '',
      style_name: style.style_name || '',
      garment_type: style.garment_type || '',
      size_template: sizeTemplate,
      colors: [makeColor(sizeTemplate)],
      total_quantity: 0,
      readiness: { smv: false, fabric: false, thread: false, accessories: false },
      engineering_status: 'Pending',
    });
  };

  const addColor = localId => {
    const po = pos.find(item => item.local_id === localId);
    if (!po?.style_id) {
      toast('Select a style before adding colors', 'error');
      return;
    }
    updatePO(localId, {
      colors: [...po.colors, makeColor(po.size_template)],
    });
  };

  const removeColor = (poLocalId, colorLocalId) => {
    const po = pos.find(item => item.local_id === poLocalId);
    const colors = po.colors.filter(color => color.local_id !== colorLocalId);
    updatePO(poLocalId, {
      colors,
      readiness: aggregateReadiness(colors),
      total_quantity: colors.reduce((sum, color) => sum + colorTotal(color), 0),
    });
  };

  const selectColor = async (poLocalId, colorLocalId, colorId) => {
    const po = pos.find(item => item.local_id === poLocalId);
    const style = styles.find(item => String(item.id) === String(po?.style_id));
    const selected = (style?.style_colors || []).find(
      item => String(item.id) === String(colorId)
    );

    if (!selected) return;

    const duplicate = po.colors.some(
      color =>
        color.local_id !== colorLocalId &&
        String(color.color_id) === String(colorId)
    );

    if (duplicate) {
      toast(`${selected.color_name} is already added to this PO`, 'error');
      return;
    }

    // Engineering consumption is controlled at style level.
    // All colors under the same PO reuse the approved SMV, Fabric BOM,
    // and Thread Engineering unless a future color-specific override is added.
    const modules = await getStyleCostSummary({
      style_id: style.id,
      color_id: null,
    });
    const readiness = readinessFromModules(modules);

    const colors = po.colors.map(color =>
      color.local_id === colorLocalId
        ? {
            ...color,
            color_id: selected.id,
            color_code:
              selected.buyer_color_code ||
              selected.color_code ||
              selected.pantone ||
              '',
            color_name: selected.color_name || '',
            readiness,
            engineering_status: isEngineeringReady(readiness)
              ? 'Ready'
              : 'Incomplete',
          }
        : color
    );

    updatePO(poLocalId, {
      colors,
      readiness: aggregateReadiness(colors),
      engineering_status: isEngineeringReady(aggregateReadiness(colors))
        ? 'Ready'
        : 'Incomplete',
    });
  };

  const setSizeQuantity = (poLocalId, colorLocalId, sizeKey, value) => {
    setPos(previous =>
      previous.map(po => {
        if (po.local_id !== poLocalId) return po;

        const colors = po.colors.map(color => {
          if (color.local_id !== colorLocalId) return color;
          return {
            ...color,
            sizes: color.sizes.map(size =>
              String(size.size_id || size.size_name) === String(sizeKey)
                ? { ...size, quantity: Math.max(0, Number(value || 0)) }
                : size
            ),
          };
        });

        return {
          ...po,
          colors,
          total_quantity: colors.reduce(
            (sum, color) => sum + colorTotal(color),
            0
          ),
        };
      })
    );
  };

  const validateForm = async targetStatus => {
    if (!header.order_number.trim()) {
      orderNumberRef.current?.focus();
      return 'Export Order number is required';
    }
    if (duplicateOrderNumber) return `Export Order ${header.order_number} already exists`;
    if (!header.buyer.trim()) return 'Buyer is required';
    if (!header.order_date) return 'Order date is required';
    if (
      header.shipment_date &&
      header.order_date &&
      header.shipment_date < header.order_date
    ) {
      return 'Shipment date cannot be before the order date';
    }
    if (!pos.length) return 'Add at least one PO';

    const localNumbers = pos.map(po => normalized(po.po_number));
    if (localNumbers.some(value => !value)) return 'Every PO requires a PO number';
    if (new Set(localNumbers).size !== localNumbers.length) {
      return 'The same PO number is entered more than once in this Export Order';
    }

    const existing = await checkDuplicatePONumbers(localNumbers, editingId);
    if (existing.length) {
      return `PO ${existing[0].po_number} already exists in another Export Order`;
    }

    for (const po of pos) {
      if (!po.style_id) return `Select a style for PO ${po.po_number}`;
      if (!po.colors.length) return `Add at least one color for PO ${po.po_number}`;
      for (const color of po.colors) {
        if (!color.color_id) return `Select every color for PO ${po.po_number}`;
        if (colorTotal(color) <= 0) {
          return `Enter size-wise quantity for ${color.color_name || 'a color'} in PO ${po.po_number}`;
        }
      }
    }

    if (targetStatus === 'Approved' && !allPOsReady) {
      return 'Cannot approve: one or more colors are missing SMV, Fabric BOM or Thread Engineering';
    }
    return null;
  };

  const save = async targetStatus => {
    setSaving(true);
    try {
      const validationError = await validateForm(targetStatus);
      if (validationError) {
        toast(validationError, 'error');
        return;
      }

      const payload = {
        ...header,
        order_number: normalized(header.order_number),
        status: targetStatus,
        pos: pos.map(po => ({
          ...po,
          po_number: normalized(po.po_number),
          total_quantity: poTotal(po),
          readiness: aggregateReadiness(po.colors),
          engineering_status: isEngineeringReady(aggregateReadiness(po.colors))
            ? 'Ready'
            : 'Incomplete',
        })),
      };

      const saved = editingId
        ? await updateExportOrder(editingId, payload)
        : await createExportOrder(payload);

      if (targetStatus === 'Approved') {
        await updateExportOrderStatus(saved.id, 'Approved');
      }

      toast(targetStatus === 'Approved'
        ? 'Export Order approved'
        : 'Export Order saved');

      await load();
      closeForm();
    } catch (error) {
      toast('Failed: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const approveFromList = async order => {
    const ready = (order.export_order_pos || []).every(po =>
      isEngineeringReady(aggregateReadiness(po.export_order_po_colors || []))
    );
    if (!ready) {
      toast('Cannot approve: engineering data is incomplete', 'error');
      return;
    }
    try {
      await updateExportOrderStatus(order.id, 'Approved');
      toast('Export Order approved');
      await load();
    } catch (error) {
      toast('Approval failed: ' + error.message, 'error');
    }
  };

  const remove = async order => {
    if (order.status !== 'Draft') {
      toast('Only Draft Export Orders can be deleted', 'error');
      return;
    }
    if (!confirm(`Delete ${order.order_number}?`)) return;
    try {
      await deleteExportOrder(order.id);
      toast('Export Order deleted');
      await load();
    } catch (error) {
      toast('Delete failed: ' + error.message, 'error');
    }
  };

  const duplicate = async order => {
    try {
      await duplicateExportOrder(order.id);
      toast('Export Order copied as Draft');
      await load();
    } catch (error) {
      toast('Copy failed: ' + error.message, 'error');
    }
  };

  if (mode === 'form') {
    return (
      <div>
        <ToastContainer />
        <PageHeader
          title={editingId ? 'Edit Export Order' : 'Create Export Order'}
          subtitle="One PO can contain multiple colors with independent size-wise quantities."
          badge={{ text: header.status }}
        />

        <div className="export-summary-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
          gap: 12,
          marginBottom: 16,
        }}>
          <SummaryCard label="Export Order" value={header.order_number || '-'} />
          <SummaryCard label="POs" value={pos.length} />
          <SummaryCard label="Colors" value={totalColors} />
          <SummaryCard
            label="Total Quantity"
            value={totalOrderQuantity.toLocaleString()}
            sublabel="pieces"
          />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            gap: 12, alignItems: 'center', marginBottom: 16,
          }}>
            <div>
              <h3>Export Order Header</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                Buyer, shipment and factory information
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={closeForm}>
              <X size={13} /> Close
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
            gap: 12,
          }}>
            <div className="field">
              <label>Export Order No. *</label>
              <input
                ref={orderNumberRef}
                value={header.order_number}
                onChange={event => setHeader(previous => ({
                  ...previous,
                  order_number: event.target.value.toUpperCase(),
                }))}
              />
              {checkingOrderNumber && (
                <small style={{ color: 'var(--text-muted)' }}>Checking...</small>
              )}
              {!checkingOrderNumber &&
                header.order_number &&
                !duplicateOrderNumber && (
                  <small style={{ color: 'var(--green)' }}>
                    Order number is available
                  </small>
                )}
              {duplicateOrderNumber && (
                <small style={{ color: 'var(--red)' }}>
                  This Export Order number already exists
                </small>
              )}
            </div>

            {[
              ['Buyer *', 'buyer'],
              ['Brand', 'brand'],
              ['Season', 'season'],
              ['Factory', 'factory_name'],
              ['Merchandiser', 'merchandiser'],
            ].map(([label, key]) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input
                  value={header[key]}
                  onChange={event => setHeader(previous => ({
                    ...previous,
                    [key]: event.target.value,
                  }))}
                />
              </div>
            ))}

            <div className="field">
              <label>Order Date *</label>
              <input
                type="date"
                value={header.order_date}
                onChange={event => setHeader(previous => ({
                  ...previous,
                  order_date: event.target.value,
                }))}
              />
            </div>
            <div className="field">
              <label>Shipment Date</label>
              <input
                type="date"
                value={header.shipment_date}
                onChange={event => setHeader(previous => ({
                  ...previous,
                  shipment_date: event.target.value,
                }))}
              />
            </div>
            <div className="field">
              <label>Delivery Date</label>
              <input
                type="date"
                value={header.delivery_date}
                onChange={event => setHeader(previous => ({
                  ...previous,
                  delivery_date: event.target.value,
                }))}
              />
            </div>
            <div className="field">
              <label>Currency</label>
              <select
                value={header.currency}
                onChange={event => setHeader(previous => ({
                  ...previous,
                  currency: event.target.value,
                }))}
              >
                <option>USD</option><option>EUR</option>
                <option>GBP</option><option>PKR</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={header.status}
                onChange={event => setHeader(previous => ({
                  ...previous,
                  status: event.target.value,
                }))}
                disabled={header.status === 'Approved'}
              >
                {ORDER_STATUSES.map(status => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Remarks</label>
              <textarea
                rows={2}
                value={header.remarks}
                onChange={event => setHeader(previous => ({
                  ...previous,
                  remarks: event.target.value,
                }))}
              />
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          gap: 12, alignItems: 'center', marginBottom: 12,
        }}>
          <div>
            <h3>PO Details</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Add multiple colors and enter size-wise quantity for each color
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setPos(previous => [...previous, makePO()])}
          >
            <Plus size={13} /> Add PO
          </button>
        </div>

        {pos.map((po, poIndex) => {
          const style = styles.find(item => String(item.id) === String(po.style_id));
          const styleColors = style?.style_colors || [];
          const poReadiness = aggregateReadiness(po.colors);

          return (
            <div
              className="card"
              key={po.local_id}
              style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}
            >
              <div
                onClick={() => updatePO(po.local_id, { expanded: !po.expanded })}
                style={{
                  background: 'var(--navy)', color: 'white',
                  padding: '12px 15px', display: 'flex',
                  justifyContent: 'space-between', gap: 12,
                  alignItems: 'center', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 27, height: 27, borderRadius: '50%',
                    background: 'var(--teal)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 12,
                  }}>{poIndex + 1}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {po.po_number || `PO ${poIndex + 1}`}
                    </div>
                    <div style={{
                      fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2,
                    }}>
                      {po.article_number || 'Select style'} | {po.colors.length} colors | {poTotal(po).toLocaleString()} pcs
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ReadinessBadge readiness={poReadiness} />
                  {pos.length > 1 && (
                    <button
                      onClick={event => {
                        event.stopPropagation();
                        setPos(previous =>
                          previous.filter(item => item.local_id !== po.local_id)
                        );
                      }}
                      style={{
                        border: 'none', borderRadius: 7,
                        background: 'rgba(255,255,255,0.14)',
                        color: 'white', padding: 6, cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {po.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {po.expanded && (
                <div style={{ padding: 16 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                    gap: 10,
                    marginBottom: 16,
                  }}>
                    <div className="field">
                      <label>PO Number *</label>
                      <input
                        value={po.po_number}
                        onChange={event => updatePO(po.local_id, {
                          po_number: event.target.value.toUpperCase(),
                        })}
                      />
                    </div>
                    <div className="field">
                      <label>Style / Article *</label>
                      <select
                        value={po.style_id}
                        onChange={event => selectStyle(po.local_id, event.target.value)}
                      >
                        <option value="">Select style</option>
                        {styles.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.article_number} - {item.style_name || item.garment_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Buyer Style</label>
                      <input
                        value={po.buyer_style}
                        onChange={event => updatePO(po.local_id, {
                          buyer_style: event.target.value,
                        })}
                      />
                    </div>
                    <div className="field">
                      <label>Total Colors</label>
                      <input value={po.colors.length} disabled />
                    </div>
                    <div className="field">
                      <label>Total PO Quantity</label>
                      <input
                        value={poTotal(po)}
                        disabled
                        style={{ fontWeight: 800, color: 'var(--teal)' }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 10, marginBottom: 10,
                  }}>
                    <div>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Palette size={15} /> Colors & Size Breakdown
                      </h4>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Each color has its own size quantities. Engineering consumption is inherited from the selected style.
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => addColor(po.local_id)}
                      disabled={!po.style_id}
                    >
                      <Plus size={13} /> Add Color
                    </button>
                  </div>

                  {!po.colors.length ? (
                    <div style={{
                      padding: 18, textAlign: 'center',
                      color: 'var(--text-muted)', background: 'var(--bg)',
                      borderRadius: 10,
                    }}>
                      Select a style, then add one or more colors.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {po.colors.map((color, colorIndex) => (
                        <div
                          key={color.local_id}
                          style={{
                            border: '1px solid var(--border-light)',
                            borderRadius: 12,
                            padding: 12,
                            background: 'white',
                          }}
                        >
                          <div className="color-header-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(180px,1.2fr) minmax(120px,.7fr) 110px auto',
                            gap: 8,
                            alignItems: 'end',
                            marginBottom: 12,
                          }}>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Color {colorIndex + 1} *</label>
                              <select
                                value={color.color_id}
                                onChange={event =>
                                  selectColor(po.local_id, color.local_id, event.target.value)
                                }
                              >
                                <option value="">Select color</option>
                                {styleColors.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {item.color_name}
                                    {item.buyer_color_code
                                      ? ` - ${item.buyer_color_code}`
                                      : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Color Code</label>
                              <input value={color.color_code} disabled />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Total</label>
                              <input
                                value={colorTotal(color)}
                                disabled
                                style={{ fontWeight: 800, color: 'var(--teal)' }}
                              />
                            </div>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeColor(po.local_id, color.local_id)}
                              disabled={po.colors.length === 1}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>

                          <div style={{ marginBottom: 9 }}>
                            <ReadinessBadge readiness={color.readiness} />
                          </div>

                          <div className="size-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(92px,1fr))',
                            gap: 7,
                          }}>
                            {color.sizes.map(size => (
                              <div
                                key={size.size_id || size.size_name}
                                style={{
                                  padding: 8,
                                  border: '1px solid var(--border-light)',
                                  borderRadius: 8,
                                  background: 'var(--bg)',
                                }}
                              >
                                <label style={{
                                  display: 'block', fontSize: 10,
                                  fontWeight: 700, marginBottom: 4,
                                }}>{size.size_name}</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={size.quantity}
                                  onChange={event => setSizeQuantity(
                                    po.local_id,
                                    color.local_id,
                                    size.size_id || size.size_name,
                                    event.target.value
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        gap: 12, padding: '10px 12px',
                        background: 'var(--teal-light)',
                        borderRadius: 10, fontWeight: 700,
                      }}>
                        <span>PO Total</span>
                        <span style={{ color: 'var(--teal)' }}>
                          {poTotal(po).toLocaleString()} pcs
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="card" style={{ marginTop: 16 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            gap: 12, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {pos.length} PO(s) | {totalColors} color(s) | {totalOrderQuantity.toLocaleString()} pieces
              </div>
              <div style={{ marginTop: 5 }}>
                <ReadinessBadge readiness={{
                  smv: allPOsReady, fabric: allPOsReady, thread: allPOsReady,
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button
                className="btn btn-secondary"
                disabled={saving || checkingOrderNumber || Boolean(duplicateOrderNumber)}
                onClick={() => save('Draft')}
              >
                <Save size={14} /> Save Draft
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  saving || checkingOrderNumber ||
                  Boolean(duplicateOrderNumber) ||
                  !allPOsValid || !allPOsReady
                }
                onClick={() => save('Approved')}
              >
                <ShieldCheck size={14} />
                {saving ? 'Saving...' : 'Approve Export Order'}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 850px) {
            .export-summary-grid {
              grid-template-columns: repeat(2,minmax(0,1fr)) !important;
            }
            .color-header-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @media (max-width: 520px) {
            .export-summary-grid {
              grid-template-columns: 1fr !important;
            }
            .color-header-grid {
              grid-template-columns: 1fr !important;
            }
            .size-grid {
              grid-template-columns: repeat(2,minmax(0,1fr)) !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer />
      <PageHeader
        title="Export Orders"
        subtitle="Create customer orders with multiple POs, multiple colors and size-wise quantities"
        badge={{ text: 'Planning' }}
      />

      <div className="export-stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: 12,
        marginBottom: 18,
      }}>
        <SummaryCard label="Total Orders" value={stats.total} />
        <SummaryCard label="Approved" value={stats.approved} />
        <SummaryCard label="Draft" value={stats.draft} />
        <SummaryCard
          label="Total Quantity"
          value={stats.quantity.toLocaleString()}
          sublabel="pieces"
        />
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 16 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
            }} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search order, PO, article, buyer or color..."
              style={{ width: '100%', paddingLeft: 32 }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={13} style={{
              position: 'absolute', left: 9, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
            }} />
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              style={{ paddingLeft: 28 }}
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map(status => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={resetForm}>
            <Plus size={14} /> New Export Order
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading Export Orders...</p></div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <PackageCheck size={34} color="var(--border)" />
          <p>No Export Orders found.</p>
          <button className="btn btn-primary" onClick={resetForm}>
            <Plus size={14} /> Create First Export Order
          </button>
        </div>
      ) : (
        <div className="data-table-wrap card" style={{ padding: 0 }}>
          <table className="data-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Export Order</th>
                <th>Buyer</th>
                <th>POs</th>
                <th>Colors</th>
                <th>Styles</th>
                <th>Total Qty</th>
                <th>Shipment</th>
                <th>Engineering</th>
                <th>Status</th>
                <th style={{ minWidth: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const poRows = order.export_order_pos || [];
                const articles = [
                  ...new Set(poRows.map(po => po.article_number).filter(Boolean)),
                ];
                const colors = poRows.reduce(
                  (sum, po) => sum + (po.export_order_po_colors || []).length,
                  0
                );
                const ready =
                  poRows.length > 0 &&
                  poRows.every(po =>
                    isEngineeringReady(
                      aggregateReadiness(po.export_order_po_colors || [])
                    )
                  );

                return (
                  <tr key={order.id}>
                    <td>
                      <strong style={{ color: 'var(--navy)' }}>
                        {order.order_number}
                      </strong>
                      <div style={{
                        fontSize: 10, color: 'var(--text-muted)', marginTop: 3,
                      }}>{order.order_date || '-'}</div>
                    </td>
                    <td>
                      <strong>{order.buyer || '-'}</strong>
                      <div style={{
                        fontSize: 10, color: 'var(--text-muted)', marginTop: 3,
                      }}>{order.brand || order.season || ''}</div>
                    </td>
                    <td>{poRows.length}</td>
                    <td>{colors}</td>
                    <td>{articles.join(', ') || '-'}</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono', fontWeight: 700,
                    }}>
                      {Number(order.total_quantity || 0).toLocaleString()}
                    </td>
                    <td>{order.shipment_date || '-'}</td>
                    <td>
                      <ReadinessBadge readiness={{
                        smv: ready, fabric: ready, thread: ready,
                      }} />
                    </td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => editOrder(order)}
                        >
                          <Eye size={12} /> View
                        </button>
                        {order.status === 'Draft' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => editOrder(order)}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => duplicate(order)}
                        >
                          <Copy size={12} /> Copy
                        </button>
                        {order.status === 'Draft' && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!ready}
                            onClick={() => approveFromList(order)}
                          >
                            <ShieldCheck size={12} /> Approve
                          </button>
                        )}
                        {order.status === 'Draft' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => remove(order)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media (max-width: 850px) {
          .export-stats-grid {
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }
        }
        @media (max-width: 520px) {
          .export-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
    }
