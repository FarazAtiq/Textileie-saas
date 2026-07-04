
// utils/bomExport.js — Shared BOM PDF/Excel export for FabricPage and ReportsPage

import { calcBomConsumption, defaultRatioForSize } from './fabricBomCalc.js';

// ── Reconstruct helpers (used when loading from saved report) ──
export function getSizeData(comp, sizeId) {
  return comp.sizeData?.[sizeId] || { mode: 'manual', layLength: 0, noOfPcs: 4, efficiency: 70, ratio: 1.0 };
}

export function calcForSize(comp, sizeId, sizes, baseSizeId) {
  const sd = getSizeData(comp, sizeId);
  let layLength = parseFloat(sd.layLength) || 0;
  if (sd.mode === 'auto' && baseSizeId && sizeId !== baseSizeId) {
    const baseSd = getSizeData(comp, baseSizeId);
    const ratio = parseFloat(sd.ratio) || defaultRatioForSize(sizes.find(s => s.id === sizeId)?.label);
    layLength = (parseFloat(baseSd.layLength) || 0) * ratio;
  }
  const consumption = calcBomConsumption({
    layLength,
    noOfPcs: parseFloat(sd.noOfPcs) || 1,
    kgsPerMtr: parseFloat(comp.kgsPerMtr) || 1,
    allowancePct: parseFloat(comp.allowancePct) || 0,
  });
  return { ...sd, layLength: +layLength.toFixed(3), consumption };
}

// ── PDF Export ──
export async function exportBomPDF({
  artNo, styleName, customer, techPackRef, consumptionNo, issueDate,
  components, sizes, baseSizeId, signOff, docType, companyName, userName
}) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const now = new Date().toLocaleDateString('en-PK');
  const pw = 297;

  // Title bar
  doc.setFillColor(15, 41, 66);
  doc.rect(0, 0, pw, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('FABRIC Consumption', pw / 2, 9, { align: 'center' });

  // Header info
  const hY = 17;
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 41, 66);

  const leftCols = [
    ['Arts:', artNo || '\u2014'],
    ['Style Name:', styleName || '\u2014'],
    ['Customer:', customer || '\u2014'],
  ];
  leftCols.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold');   doc.text(k, 14, hY + i * 5);
    doc.setFont('helvetica', 'normal'); doc.text(v, 40, hY + i * 5);
  });

  const rtX = pw - 80;
  doc.setFont('helvetica', 'bold'); doc.text('Tech Pack Ref#:', rtX, hY);
  doc.setFont('helvetica', 'normal'); doc.text(techPackRef || '\u2014', rtX + 28, hY);
  doc.setFont('helvetica', 'bold'); doc.text('Consumption#:', rtX, hY + 5);
  doc.setFont('helvetica', 'normal'); doc.text(consumptionNo || '\u2014', rtX + 28, hY + 5);
  doc.setFont('helvetica', 'bold'); doc.text('Issue Date:', rtX, hY + 10);
  doc.setFont('helvetica', 'normal'); doc.text(issueDate, rtX + 28, hY + 10);

  // Doc type checkboxes
  const cbY = hY + 16;
  [['Costing', 'costing'], ['First BOM', 'firstBom'], ['Final Review after Trial Run', 'finalReview']].forEach(([label, val], i) => {
    const x = rtX + i * 30;
    doc.setFillColor(docType === val ? 13 : 255, docType === val ? 122 : 255, docType === val ? 107 : 255);
    doc.rect(x, cbY - 3, 3, 3, 'F');
    doc.rect(x, cbY - 3, 3, 3, 'S');
    doc.setFont('helvetica', docType === val ? 'bold' : 'normal');
    doc.text(label, x + 4, cbY);
  });

  const tableStartY = hY + 26;

  // ── Dynamic column sizing based on number of sizes ──
  const sizeLabels = sizes.map(s => s.label);
  const sizeSubCols = ['Lay(m)', 'Pcs', 'Eff%', 'Cons.(BOM)', 'Allow%'];
  const fixedCount = 9;

  // Calculate optimal widths
  const availableWidth = pw - 10; // 5mm margin each side
  const minFixedWidth = 8 + 20 + 26 + 14 + 16 + 8 + 12 + 10 + 8; // = 122
  const remainingWidth = availableWidth - minFixedWidth;
  const sizeColCount = sizes.length * sizeSubCols.length;

  // If many sizes, reduce fixed col widths and size sub-col widths
  let fixedWidths, sizeColW;
  if (sizes.length <= 4) {
    fixedWidths = [8, 22, 28, 14, 16, 8, 12, 10, 8];
    sizeColW = Math.min(10, Math.floor(remainingWidth / sizeColCount));
  } else if (sizes.length <= 6) {
    fixedWidths = [7, 18, 24, 12, 14, 7, 10, 9, 7];
    sizeColW = Math.min(8.5, Math.floor(remainingWidth / sizeColCount));
  } else {
    fixedWidths = [6, 16, 20, 10, 12, 6, 9, 8, 6];
    sizeColW = Math.min(7.5, Math.floor(remainingWidth / sizeColCount));
  }

  const colWidths = [...fixedWidths, ...Array(sizeColCount).fill(sizeColW)];

  const headRow1 = ['Comp\n#', 'Usage at\n(Gmt Part)', 'Fabric\nDescription', 'Fabric\nCode', 'Supplier', 'GSM', 'Cuttable\nWidth', 'Kgs/\nMtr', 'UOM'];
  sizeLabels.forEach(sl => headRow1.push(sl, '', '', '', '', ''));

  const headRow2 = ['', '', '', '', '', '', '', '', ''];
  sizeLabels.forEach(() => sizeSubCols.forEach(sc => headRow2.push(sc)));

  const body = components.map(c => {
    const row = [
      c.compNo,
      c.usageAt || '',
      c.fabricDescription || '',
      c.fabricCode || '',
      c.supplier || '',
      c.gsm || '',
      c.cuttableWidth || '',
      c.kgsPerMtr || '',
      c.uom || 'KG',
    ];
    sizes.forEach(s => {
      const sd = getSizeData(c, s.id);
      const calc = calcForSize(c, s.id, sizes, baseSizeId);
      row.push(
        calc.layLength || 0,
        sd.noOfPcs || 0,
        (sd.efficiency || 0) + '%',
        calc.consumption.toFixed(3),
        (c.allowancePct || 0) + '%',
      );
    });
    return row;
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [headRow1, headRow2],
    body,
    theme: 'grid',
    headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 5.5, fontStyle: 'bold', halign: 'center', valign: 'middle', cellPadding: 0.8 },
    bodyStyles: { fontSize: 5.5, cellPadding: 1, valign: 'middle' },
    columnStyles: Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w, halign: i < fixedCount ? 'left' : 'center' }])),
    didParseCell: (data) => {
      if (data.section === 'head' && data.row.index === 0 && data.column.index >= fixedCount) {
        const relIdx = (data.column.index - fixedCount) % sizeSubCols.length;
        if (relIdx !== 0) { data.cell.text = ['']; }
      }
      if (data.section === 'body' && data.column.index >= fixedCount) {
        const relIdx = (data.column.index - fixedCount) % sizeSubCols.length;
        if (relIdx === 3) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [13, 122, 107]; }
      }
    },
    margin: { left: 5, right: 5 },
    tableWidth: 'wrap',
  });

  // Sign-off
  const finalY = doc.lastAutoTable.finalY + 8;
  if (finalY < 195) {
    doc.setFillColor(240, 248, 255);
    doc.rect(5, finalY, pw - 10, 14, 'F');
    doc.setDrawColor(180);
    doc.rect(5, finalY, (pw - 10) / 3, 14, 'S');
    doc.rect(5 + (pw - 10) / 3, finalY, (pw - 10) / 3, 14, 'S');
    doc.rect(5 + 2 * (pw - 10) / 3, finalY, (pw - 10) / 3, 14, 'S');

    doc.setFontSize(6); doc.setTextColor(100, 120, 140); doc.setFont('helvetica', 'bold');
    doc.text('PROVIDED BY \u2014 GGT', 8, finalY + 4);
    doc.text('APPROVED BY \u2014 PD MANAGER', 8 + (pw - 10) / 3, finalY + 4);
    doc.text('RECEIVED BY', 8 + 2 * (pw - 10) / 3, finalY + 4);

    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 41, 66); doc.setFontSize(7);
    doc.text(signOff?.providedBy || '_______________________', 8, finalY + 11);
    doc.text(signOff?.approvedBy || '_______________________', 8 + (pw - 10) / 3, finalY + 11);
    doc.text(signOff?.receivedBy || '_______________________', 8 + 2 * (pw - 10) / 3, finalY + 11);
  }

  doc.setFontSize(6); doc.setTextColor(160);
  doc.text('TextileIE \u2014 ' + (companyName || '') + '  |  Generated: ' + now, 5, 205);

  doc.save('Fabric-BOM-' + (artNo || styleName || 'sheet') + '-' + Date.now() + '.pdf');
}

// ── Excel Export ──
export function exportBomExcel({
  artNo, styleName, customer, techPackRef, consumptionNo, issueDate,
  components, sizes, baseSizeId, signOff, docType
}) {
  const sizeLabels = sizes.map(s => s.label);
  const subCols = ['Lay Length (m)', 'No of Pcs', 'Efficiency%', 'Consumption (BOM)', 'Allowance%'];

  const hr1 = ['Comp#', 'Usage at', 'Fabric Description', 'Fabric Code', 'Supplier', 'GSM', 'Cuttable Width', 'Kgs/Mtr', 'UOM'];
  sizeLabels.forEach(sl => { hr1.push(sl); for (let i = 1; i < subCols.length; i++) hr1.push(''); });

  const hr2 = ['', '', '', '', '', '', '', '', ''];
  sizeLabels.forEach(() => subCols.forEach(sc => hr2.push(sc)));

  const dataRows = components.map((c, ri) => {
    const cells = [c.compNo, c.usageAt, c.fabricDescription, c.fabricCode, c.supplier, c.gsm, c.cuttableWidth, c.kgsPerMtr, c.uom];
    sizes.forEach(s => {
      const sd = getSizeData(c, s.id);
      const calc = calcForSize(c, s.id, sizes, baseSizeId);
      cells.push(
        calc.layLength || 0, sd.noOfPcs || 0, (sd.efficiency || 0) + '%',
        calc.consumption.toFixed(3),
        (c.allowancePct || 0) + '%'
      );
    });
    return '<tr style="background:' + (ri % 2 === 0 ? '#F4F7FA' : '#FFFFFF') + '">' +
      cells.map((v, ci) => {
        const isCons = ci >= 9 && (ci - 9) % subCols.length === 3;
        return '<td style="border:1px solid #D8E4EE;padding:3px 4px;font-size:8pt' + (isCons ? ';font-weight:bold;color:#0D7A6B' : '') + '">' + v + '</td>';
      }).join('') + '</tr>';
  }).join('');

  const totalCols = 9 + sizes.length * subCols.length;
  const headerStyle = 'style="background:#0F2942;color:white;font-weight:bold;padding:4px 5px;border:1px solid #0F2942;font-size:8pt"';

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"></head><body><table>
<tr><td colspan="${totalCols}" style="background:#0F2942;color:white;font-weight:bold;font-size:14pt;padding:8px;border:1px solid #0F2942">FABRIC Consumption \u2014 TextileIE</td></tr>
<tr>
  <td colspan="2" style="background:#E4F4F1;padding:5px;border:1px solid #D8E4EE;font-weight:bold">Art#: ${artNo || '\u2014'}</td>
  <td colspan="2" style="background:#E4F4F1;padding:5px;border:1px solid #D8E4EE;font-weight:bold">Style: ${styleName || '\u2014'}</td>
  <td colspan="2" style="background:#E4F4F1;padding:5px;border:1px solid #D8E4EE;font-weight:bold">Customer: ${customer || '\u2014'}</td>
  
  <td colspan="${totalCols - 8}" style="background:#E4F4F1;padding:5px;border:1px solid #D8E4EE;font-weight:bold">Issue Date: ${issueDate} | Doc: ${docType} | Tech Pack: ${techPackRef || '\u2014'}</td>
</tr>
<tr>${hr1.map(h => '<th ' + headerStyle + '>' + h + '</th>').join('')}</tr>
<tr>${hr2.map(h => '<th ' + headerStyle + ' style="background:#1E3A5F;color:white;font-weight:bold;padding:3px 4px;border:1px solid #1E3A5F;font-size:7pt">' + h + '</th>').join('')}</tr>
${dataRows}
<tr><td colspan="${totalCols}" style="padding:6px;border:1px solid #D8E4EE;color:#444;font-size:9pt">
  PROVIDED BY \u2014 GGT: ${signOff?.providedBy || ''} &nbsp;&nbsp;&nbsp; 
  APPROVED BY \u2014 PD MANAGER: ${signOff?.approvedBy || ''} &nbsp;&nbsp;&nbsp; 
  RECEIVED BY: ${signOff?.receivedBy || ''}
</td></tr>
</table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Fabric-BOM-' + (artNo || styleName || 'sheet') + '-' + Date.now() + '.xls';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
