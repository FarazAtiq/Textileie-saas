import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Save, X } from 'lucide-react';
import {
  createStitch,
  getStitches,
  updateStitch,
} from '../../lib/db.js';

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

const SEAM_CLASSES = [
  { value: 'SS', label: 'SS - Superimposed Seam' },
  { value: 'LS', label: 'LS - Lapped Seam' },
  { value: 'BS', label: 'BS - Bound Seam' },
  { value: 'FS', label: 'FS - Flat Seam' },
  { value: 'OS', label: 'OS - Ornamental Seam' },
  { value: 'EF', label: 'EF - Edge Finishing Seam' },
];

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function validateForm(form) {
  const errors = [];

  if (!normalizeCode(form.stitch_code)) {
    errors.push('Stitch code is required');
  }

  if (!String(form.stitch_name || '').trim()) {
    errors.push('Stitch name is required');
  }

  const needleRatio = Number(form.needle_ratio || 0);
  const looperRatio = Number(form.looper_ratio || 0);
  const coverRatio = Number(form.cover_ratio || 0);
  const spi = Number(form.default_spi || 0);

  if (needleRatio < 0 || looperRatio < 0 || coverRatio < 0) {
    errors.push('Thread ratios cannot be negative');
  }

  if (spi <= 0) {
    errors.push('Default SPI must be greater than zero');
  }

  if (needleRatio + looperRatio + coverRatio <= 0) {
    errors.push('At least one thread ratio must be greater than zero');
  }

  return errors;
}

function RatioPreview({ form }) {
  const needle = Number(form.needle_ratio || 0);
  const looper = Number(form.looper_ratio || 0);
  const cover = Number(form.cover_ratio || 0);
  const total = needle + looper + cover;

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        padding: '12px 14px',
        borderRadius: 10,
        background: 'var(--teal-light)',
        border: '1px solid var(--teal-mid)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--teal)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        Thread ratio preview
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
          fontSize: 12,
        }}
      >
        <div>
          <strong>Needle:</strong> {needle > 0 ? `${needle} parts` : 'Not used'}
        </div>
        <div>
          <strong>Looper:</strong> {looper > 0 ? `${looper} parts` : 'Not used'}
        </div>
        <div>
          <strong>Cover:</strong> {cover > 0 ? `${cover} parts` : 'Not used'}
        </div>
        <div>
          <strong>Total:</strong> {total.toFixed(2)} parts
        </div>
      </div>
    </div>
  );
}

export default function StitchForm({
  editing,
  onCancel,
  onSaved,
  toast,
}) {
  const [form, setForm] = useState(
    editing ? { ...blankStitch(), ...editing } : blankStitch()
  );
  const [saving, setSaving] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateCode, setDuplicateCode] = useState(null);
  const [duplicateName, setDuplicateName] = useState(null);
  const [duplicateCheckError, setDuplicateCheckError] = useState('');

  const set = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const normalizedCode = useMemo(
    () => normalizeCode(form.stitch_code),
    [form.stitch_code]
  );

  const normalizedName = useMemo(
    () => normalizeName(form.stitch_name),
    [form.stitch_name]
  );

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (!normalizedCode && !normalizedName) {
        setDuplicateCode(null);
        setDuplicateName(null);
        setDuplicateCheckError('');
        return;
      }

      setCheckingDuplicate(true);
      setDuplicateCheckError('');

      try {
        const stitches = await getStitches({ limit: 500 });

        if (cancelled) return;

        const otherRecords = (stitches || []).filter(
          (stitch) => String(stitch.id) !== String(editing?.id || '')
        );

        const codeMatch = normalizedCode
          ? otherRecords.find(
              (stitch) =>
                normalizeCode(stitch.stitch_code) === normalizedCode
            ) || null
          : null;

        const nameMatch = normalizedName
          ? otherRecords.find(
              (stitch) =>
                normalizeName(stitch.stitch_name) === normalizedName
            ) || null
          : null;

        setDuplicateCode(codeMatch);
        setDuplicateName(nameMatch);
      } catch (error) {
        if (!cancelled) {
          setDuplicateCheckError(
            error?.message || 'Unable to check duplicate stitches'
          );
        }
      } finally {
        if (!cancelled) {
          setCheckingDuplicate(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedCode, normalizedName, editing?.id]);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const hasDuplicate = Boolean(duplicateCode || duplicateName);
  const canSave =
    !saving &&
    !checkingDuplicate &&
    !hasDuplicate &&
    validationErrors.length === 0;

  const save = async () => {
    const errors = validateForm(form);

    if (errors.length) {
      toast(errors[0], 'error');
      return;
    }

    if (checkingDuplicate) {
      toast('Please wait while duplicate checking finishes', 'error');
      return;
    }

    if (duplicateCode) {
      toast(
        `Stitch code ${normalizedCode} already exists as ${
          duplicateCode.stitch_name || 'an existing stitch'
        }. Please edit the existing record or use another code.`,
        'error'
      );
      return;
    }

    if (duplicateName) {
      toast(
        `Stitch name "${form.stitch_name.trim()}" already exists with code ${
          duplicateName.stitch_code || '-'
        }. Please edit the existing record or use another name.`,
        'error'
      );
      return;
    }

    const payload = {
      ...form,
      stitch_code: normalizedCode,
      stitch_name: String(form.stitch_name || '').trim(),
      seam_class: String(form.seam_class || '').trim(),
      needle_ratio: Number(form.needle_ratio || 0),
      looper_ratio: Number(form.looper_ratio || 0),
      cover_ratio: Number(form.cover_ratio || 0),
      default_spi: Number(form.default_spi || 0),
      description: String(form.description || '').trim(),
      status: form.status || 'Active',
    };

    setSaving(true);

    try {
      if (editing?.id) {
        await updateStitch(editing.id, payload);
        toast('Stitch updated');
      } else {
        await createStitch(payload);
        toast('Stitch created');
      }

      await onSaved?.();
    } catch (error) {
      const message = String(error?.message || '');

      if (
        message.toLowerCase().includes('duplicate') ||
        message.toLowerCase().includes('unique')
      ) {
        toast(
          `Stitch code ${payload.stitch_code} already exists. Please edit the existing record or use another code.`,
          'error'
        );
      } else {
        toast('Failed: ' + message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ padding: 18, marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h3>{editing ? 'Edit Stitch' : 'Create Stitch'}</h3>
          <p
            style={{
              marginTop: 4,
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            Stitch Master controls SPI and thread ratios used by Thread
            Engineering.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onCancel}
          disabled={saving}
        >
          <X size={13} /> Close
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        <div className="field">
          <label>Stitch Code *</label>
          <input
            value={form.stitch_code}
            onChange={(event) =>
              set('stitch_code', event.target.value.toUpperCase())
            }
            onBlur={() => set('stitch_code', normalizedCode)}
            placeholder="504"
            autoComplete="off"
          />

          {checkingDuplicate && normalizedCode && (
            <div
              style={{
                marginTop: 5,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Checking stitch code...
            </div>
          )}

          {!checkingDuplicate &&
            normalizedCode &&
            !duplicateCode &&
            !duplicateCheckError && (
              <div
                style={{
                  marginTop: 5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: 'var(--green)',
                }}
              >
                <CheckCircle2 size={12} />
                Stitch code is available
              </div>
            )}

          {duplicateCode && (
            <div
              style={{
                marginTop: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--red-light)',
                color: 'var(--red)',
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              <strong>Stitch code already exists.</strong>
              <br />
              {duplicateCode.stitch_code} {' - '}
              {duplicateCode.stitch_name || 'Existing stitch'}
            </div>
          )}
        </div>

        <div className="field">
          <label>Stitch Name *</label>
          <input
            value={form.stitch_name}
            onChange={(event) => set('stitch_name', event.target.value)}
            placeholder="Overlock 3 Thread"
            autoComplete="off"
          />

          {duplicateName && (
            <div
              style={{
                marginTop: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--amber-light)',
                color: 'var(--amber)',
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              <strong>Stitch name already exists.</strong>
              <br />
              Existing code: {duplicateName.stitch_code || '-'}
            </div>
          )}
        </div>

        <div className="field">
          <label>Seam Class</label>
          <select
            value={form.seam_class}
            onChange={(event) => set('seam_class', event.target.value)}
          >
            <option value="">Select seam class</option>
            {SEAM_CLASSES.map((seamClass) => (
              <option key={seamClass.value} value={seamClass.value}>
                {seamClass.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Default SPI *</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={form.default_spi}
            onChange={(event) => set('default_spi', event.target.value)}
            placeholder="12"
          />
        </div>

        <div className="field">
          <label>Needle Ratio</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.needle_ratio}
            onChange={(event) => set('needle_ratio', event.target.value)}
            placeholder="4"
          />
        </div>

        <div className="field">
          <label>Looper Ratio</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.looper_ratio}
            onChange={(event) => set('looper_ratio', event.target.value)}
            placeholder="10"
          />
        </div>

        <div className="field">
          <label>Cover Ratio</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.cover_ratio}
            onChange={(event) => set('cover_ratio', event.target.value)}
            placeholder="0"
          />
        </div>

        <div className="field">
          <label>Status</label>
          <select
            value={form.status}
            onChange={(event) => set('status', event.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Development">Development</option>
            <option value="Inactive">Inactive</option>
            <option value="Obsolete">Obsolete</option>
          </select>
        </div>

        <RatioPreview form={form} />

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="Default ratios and usage notes for this stitch type"
            rows={3}
          />
        </div>
      </div>

      {duplicateCheckError && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--amber-light)',
            color: 'var(--amber)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 7,
          }}
        >
          <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          Duplicate checking could not be completed: {duplicateCheckError}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--red-light)',
            color: 'var(--red)',
            fontSize: 12,
          }}
        >
          {validationErrors[0]}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSave}
          onClick={save}
          title={
            hasDuplicate
              ? 'Resolve duplicate stitch data before saving'
              : validationErrors[0] || ''
          }
        >
          <Save size={14} />
          {saving
            ? 'Saving...'
            : checkingDuplicate
              ? 'Checking...'
              : editing
                ? 'Update Stitch'
                : 'Save Stitch'}
        </button>
      </div>
    </div>
  );
      }
