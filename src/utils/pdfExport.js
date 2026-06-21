import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportReportPDF({ type, title, inputs, results, companyName, userName }) {
  const doc = new jsPDF();
  const now = new Date().toLocaleString('en-PK');

  // Navy header bar
  doc.setFillColor(15, 41, 66);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setFillColor(13, 122, 107);
  doc.rect(0, 28, 210, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('TextileIE', 14, 14);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Industrial Engineering Suite', 14, 22);
  doc.text(companyName || '', 140, 14);
  doc.text(userName || '', 140, 22);

  // Report title
  doc.setTextColor(15, 41, 66);
  doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 44);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 120, 140);
  doc.text(`Generated: ${now}`, 14, 51);
  doc.text(`Type: ${type.toUpperCase()}`, 14, 57);

  let y = 66;

  const tableOpts = {
    theme: 'striped',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 4 },
  };

  // Inputs
  doc.setTextColor(15, 41, 66); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Inputs', 14, y); y += 3;
  autoTable(doc, {
    ...tableOpts, startY: y,
    head: [['Parameter', 'Value']],
    headStyles: { fillColor: [13, 122, 107], textColor: 255 },
    body: Object.entries(inputs).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), String(v)
    ]),
  });
  y = doc.lastAutoTable.finalY + 10;

  // Results
  doc.setTextColor(15, 41, 66); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Results', 14, y); y += 3;
  autoTable(doc, {
    ...tableOpts, startY: y,
    head: [['Metric', 'Value']],
    headStyles: { fillColor: [15, 41, 66], textColor: 255 },
    body: Object.entries(results).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), String(v)
    ]),
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(180);
    doc.text(`TextileIE — ${companyName} | Page ${i} of ${pages}`, 14, 290);
    doc.text('Confidential', 170, 290);
  }

  doc.save(`textileie-${type}-${Date.now()}.pdf`);
}
