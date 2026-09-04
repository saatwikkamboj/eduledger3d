export function formatINR(amount) {
  const v = Number(amount) || 0;
  return `₹ ${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const FEE_TYPES = ['Tuition', 'Transport', 'Exam', 'Admission', 'Library', 'Lab', 'Miscellaneous'];
export const FREQUENCIES = ['Monthly', 'Quarterly', 'Annual', 'OneTime'];
export const PAYMENT_MODES = ['Cash', 'Cheque', 'UPI', 'Bank Transfer', 'DD'];
