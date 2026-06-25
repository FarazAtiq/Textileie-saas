import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportReportPDF({ type, title, inputs, results, companyName, userName }) {
  const doc = new jsPDF();
  const now = new Date().toLocaleString('en-PK');

  // Header
  doc.setFillColor(15, 41, 66);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(13, 122, 107);
  doc.rect(0, 26, 210, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('TextileIE', 14, 13);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Industrial Engineering Suite', 14, 21);
  doc.text(companyName || '', 140, 13);
  doc.text(userName || '', 140, 21);

  // Title
  doc.setTextColor(15, 41, 66);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 120, 140);
  doc.text('Generated: ' + now, 14, 47);
  doc.text('Type: ' + type.toUpperCase(), 14, 53);

  // Type-specific reports
  if (type === 'efficiency') {
    const eff = Number(results.efficiency || 0);
    const effColor = eff >= 75 ? [5, 150, 105] : eff >= 55 ? [217, 119, 6] : [220, 38, 38];

    // Efficiency gauge visual
    doc.setFillColor(...effColor);
    doc.circle(170, 55, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(eff.toFixed(1) + '%', 162, 58);
    doc.setFontSize(7);
    doc.text('EFFICIENCY', 161, 63);

    let y = 62;
    // Inputs table
    doc.setTextColor(15, 41, 66);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Inputs', 14, y); y += 3;
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Parameter', 'Value']],
      body: Object.entries(inputs).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]),
      headStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 }, theme: 'striped'
    });
    y = doc.lastAutoTable.finalY + 8;

    // Results table with color coding
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Results', 14, y); y += 3;
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Metric', 'Value']],
      body: Object.entries(results).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]),
      headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 }, theme: 'striped',
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0 && data.cell.raw === 'Efficiency') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = effColor;
        }
      }
    });

    // Benchmark bar
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 41, 66);
    doc.text('Efficiency scale', 14, finalY);
    const barW = 182; const barH = 10; const barX = 14; const barY = finalY + 4;
    doc.setFillColor(220, 38, 38);   doc.rect(barX, barY, barW * 0.55, barH, 'F');
    doc.setFillColor(217, 119, 6);   doc.rect(barX + barW * 0.55, barY, barW * 0.20, barH, 'F');
    doc.setFillColor(5, 150, 105);   doc.rect(barX + barW * 0.75, barY, barW * 0.25, barH, 'F');
    // Pointer
    const ptr = barX + (Math.min(eff, 100) / 100) * barW;
    doc.setFillColor(255, 255, 255);
    doc.triangle(ptr - 3, barY - 1, ptr + 3, barY - 1, ptr, barY + 2, 'F');
    doc.setFontSize(7); doc.setTextColor(255, 255, 255);
    doc.text('< 55% Below target', barX + 2, barY + 7);
    doc.text('55-75%', barX + barW * 0.56, barY + 7);
    doc.text('> 75% World class', barX + barW * 0.76, barY + 7);

  } else if (type === 'capacity') {
    let y = 62;
    doc.setTextColor(15, 41, 66);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Inputs', 14, y); y += 3;
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Parameter', 'Value']],
      body: Object.entries(inputs).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]),
      headStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 }, theme: 'striped'
    });
    y = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Capacity Results', 14, y); y += 3;
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Period', 'Capacity']],
      body: [
        ['Daily capacity',   (results.dailyCapacity  || 0).toLocaleString() + ' pcs'],
        ['Weekly capacity',  (results.weeklyCapacity || 0).toLocaleString() + ' pcs'],
        ['Monthly capacity', (results.monthlyCapacity || 0).toLocaleString() + ' pcs'],
        ['Effective minutes', (results.effectiveMinutes || 0).toLocaleString() + ' min'],
        ['Minutes per piece', (results.minutesPerPiece || 0) + ' min'],
      ],
      headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 9 }, theme: 'striped'
    });

  } else {
    // Generic for other types
    let y = 62;
    doc.setTextColor(15, 41, 66);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Inputs', 14, y); y += 3;
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Parameter', 'Value']],
      body: Object.entries(inputs).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]),
      headStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 }, theme: 'striped'
    });
    y = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Results', 14, y); y += 3;
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Metric', 'Value']],
      body: Object.entries(results).map(([k, v]) => [k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()), String(v)]),
      headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 }, theme: 'striped'
    });
  }

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(180);
    doc.text('TextileIE — ' + (companyName || '') + ' | Page ' + i + ' of ' + pages + ' | Confidential', 14, 290);
  }

  doc.save('TextileIE-' + type + '-' + Date.now() + '.pdf');
}
