import { useState } from 'react';
import { calcYarnCount, formatNum } from '../utils/calculations.js';
import {
  ResultCard,
  PageHeader,
  CalcGrid,
  FormulaNote
} from '../components/ResultCard.jsx';
import { createReport } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { Save } from 'lucide-react';

function useSave(type, titleFn, inputs, results) {
  const [saving, setSaving] = useState(false);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();

  const save = async () => {
    setSaving(true);
    try {
      await createReport({
        type,
        title: titleFn(),
        inputs,
        results,
      });

      toast(type.charAt(0).toUpperCase() + type.slice(1) + ' report saved');
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const doExport = (title) =>
    exportReportPDF({
      type,
      title,
      inputs,
      results,
      companyName: profile?.company_name,
      userName: profile?.full_name,
    });

  return {
    save,
    doExport,
    saving,
    ToastContainer,
  };
}

export default function YarnPage() {
  const [inp, setInp] = useState({
    weightGrams: 10,
    lengthMeters: 1270,
    system: 'ne',
  });

  const set = (k) => (e) =>
    setInp((p) => ({
      ...p,
      [k]: k === 'system'
        ? e.target.value
        : parseFloat(e.target.value) || 0,
    }));

  const r = calcYarnCount(inp);

  const {
    save,
    saving,
    ToastContainer,
  } = useSave(
    'yarn',
    () => 'Yarn Count - ' + new Date().toLocaleDateString(),
    inp,
    r
  );

  return (
    <div>
      <ToastContainer />

      <PageHeader
        title="Yarn Count Calculator"
        subtitle="Convert between Ne, Tex and Nm yarn count systems"
        badge={{ text: 'IE Formula' }}
      />

      <CalcGrid>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Inputs</h3>

          <div className="field">
            <label>Weight (grams)</label>
            <input
              type="number"
              value={inp.weightGrams}
              onChange={set('weightGrams')}
            />
          </div>

          <div className="field">
            <label>Length (meters)</label>
            <input
              type="number"
              value={inp.lengthMeters}
              onChange={set('lengthMeters')}
            />
          </div>

          <div className="field">
            <label>System</label>

            <select
              value={inp.system}
              onChange={set('system')}
            >
              <option value="ne">Ne</option>
              <option value="tex">Tex</option>
              <option value="nm">Nm</option>
            </select>
          </div>

          <FormulaNote>
            Ne = (Length yds / 840) / (Weight lbs)
            <br />
            Tex = (g/m) × 1000
            <br />
            Nm = m/g
          </FormulaNote>
        </div>

        <ResultCard
          title="Results"
          mainValue={formatNum(r.primaryValue, 2)}
          mainLabel={inp.system.toUpperCase()}
          rows={[
            {
              label: 'Ne',
              value: formatNum(r.ne, 2),
              highlight: inp.system === 'ne',
            },
            {
              label: 'Tex',
              value: formatNum(r.tex, 2),
              highlight: inp.system === 'tex',
            },
            {
              label: 'Nm',
              value: formatNum(r.nm, 2),
              highlight: inp.system === 'nm',
            },
          ]}
          onSave={save}
          saving={saving}
        />
      </CalcGrid>
    </div>
  );
}
