const { amountToWords } = require('./numberToWords');

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Builds a print-ready standalone HTML document for one payment receipt.
 * @param {object} p
 * @param {object} p.school   { name, address, affiliationCode, receiptPrefix, logoDataUrl, stampDataUrl, phone, email }
 * @param {object} p.student  { fullName, admissionId, className, section, fatherName }
 * @param {object} p.payment  { receiptNumber, amount, paymentMode, referenceNumber, paymentDate, cashierName, feeBreakdown, balanceAfter }
 */
function buildReceiptHtml({ school, student, payment }) {
  const breakdown = Array.isArray(payment.feeBreakdown) ? payment.feeBreakdown : [];
  const rows = breakdown.length
    ? breakdown.map((b) => `
        <tr>
          <td>${esc(b.label)}</td>
          <td class="num">₹ ${fmtMoney(b.amount)}</td>
        </tr>`).join('')
    : `<tr><td>Fee Payment</td><td class="num">₹ ${fmtMoney(payment.amount)}</td></tr>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${esc(payment.receiptNumber)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #111827;
    margin: 0;
    padding: 24px;
    background: #ffffff;
  }
  .receipt {
    max-width: 720px;
    margin: 0 auto;
    border: 1.5px solid #111827;
    padding: 28px;
  }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 14px; }
  .head .logo { height: 56px; width: 56px; object-fit: contain; margin-right: 14px; border-radius: 8px; }
  .head-left { display: flex; align-items: center; }
  .school-name { font-size: 20px; font-weight: 700; margin: 0; }
  .school-meta { font-size: 11px; color: #4b5563; margin-top: 2px; }
  .receipt-title { text-align: right; }
  .receipt-title h2 { margin: 0; font-size: 16px; letter-spacing: 1px; }
  .receipt-title .no { font-size: 13px; color: #374151; margin-top: 2px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 13px; margin-bottom: 16px; }
  .info-grid div span.label { color: #6b7280; display: inline-block; min-width: 110px; }
  table.fees { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.fees th, table.fees td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 13px; text-align: left; }
  table.fees th { background: #f3f4f6; }
  table.fees td.num, table.fees th.num { text-align: right; }
  .total-row td { font-weight: 700; }
  .words { font-size: 12.5px; font-style: italic; margin: 10px 0 18px; }
  .balance { font-size: 13px; margin-bottom: 24px; }
  .balance b.overdue { color: #b91c1c; }
  .balance b.ok { color: #047857; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
  .sign-block { text-align: center; font-size: 12px; }
  .sign-block img { height: 50px; display: block; margin: 0 auto 4px; }
  .sign-line { border-top: 1px solid #111827; width: 160px; margin-top: 36px; padding-top: 4px; }
  .note { font-size: 10.5px; color: #6b7280; margin-top: 18px; text-align: center; }
  @media print {
    body { padding: 0; }
    .receipt { border: 1.5px solid #111827; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <div class="head">
      <div class="head-left">
        ${school.logoDataUrl ? `<img class="logo" src="${school.logoDataUrl}" />` : ''}
        <div>
          <p class="school-name">${esc(school.name)}</p>
          <div class="school-meta">${esc(school.address || '')}</div>
          <div class="school-meta">
            ${school.affiliationCode ? `Affiliation Code: ${esc(school.affiliationCode)}` : ''}
            ${school.phone ? ` &nbsp;|&nbsp; Ph: ${esc(school.phone)}` : ''}
          </div>
        </div>
      </div>
      <div class="receipt-title">
        <h2>FEE RECEIPT</h2>
        <div class="no">No: ${esc(payment.receiptNumber)}</div>
        <div class="no">Date: ${esc(payment.paymentDate)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div><span class="label">Student Name:</span> <b>${esc(student.fullName)}</b></div>
      <div><span class="label">Admission ID:</span> ${esc(student.admissionId)}</div>
      <div><span class="label">Father's Name:</span> ${esc(student.fatherName || '-')}</div>
      <div><span class="label">Class / Section:</span> ${esc(student.className)}${student.section ? ' - ' + esc(student.section) : ''}</div>
      <div><span class="label">Payment Mode:</span> ${esc(payment.paymentMode)}</div>
      <div><span class="label">Reference No:</span> ${esc(payment.referenceNumber || '-')}</div>
    </div>

    <table class="fees">
      <thead><tr><th>Fee Head</th><th class="num">Amount</th></tr></thead>
      <tbody>
        ${rows}
        <tr class="total-row"><td>Total Paid</td><td class="num">₹ ${fmtMoney(payment.amount)}</td></tr>
      </tbody>
    </table>

    <div class="words">Amount in Words: ${esc(amountToWords(payment.amount))}</div>

    <div class="balance">
      Balance Pending after this payment:
      <b class="${(payment.balanceAfter || 0) > 0 ? 'overdue' : 'ok'}">₹ ${fmtMoney(payment.balanceAfter || 0)}</b>
    </div>

    <div class="footer">
      <div class="sign-block">
        <div class="sign-line">Cashier: ${esc(payment.cashierName || '-')}</div>
      </div>
      <div class="sign-block">
        ${school.stampDataUrl ? `<img src="${school.stampDataUrl}" />` : ''}
        <div class="sign-line">Authorized Signatory / Stamp</div>
      </div>
    </div>

    <div class="note">This is a system-generated receipt from ${esc(school.name)}. Generated offline via EduLedger 3D.</div>
  </div>
</body>
</html>`;
}

module.exports = { buildReceiptHtml };
