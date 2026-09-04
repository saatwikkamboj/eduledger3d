import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { formatINR } from '../utils/formatCurrency';
import { PAYMENT_MODES } from '../utils/formatCurrency';

export default function FeeEntryModal({ open, onClose, student, onSaved }) {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const pushToast = useAppStore((s) => s.pushToast);
  const fireParticleBurst = useAppStore((s) => s.fireParticleBurst);
  const confirmBtnRef = useRef(null);

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cashier, setCashier] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  useEffect(() => {
    if (open) {
      setAmount(student?.balance_pending ? String(student.balance_pending) : '');
      setMode('Cash');
      setReference('');
      setDate(new Date().toISOString().slice(0, 10));
      setRemarks('');
      setLastReceipt(null);
    }
  }, [open, student?.id]);

  const projectedBalance = Math.max(0, (student?.balance_pending || 0) - (Number(amount) || 0));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!activeSchool || !student) return;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      pushToast({ tone: 'error', title: 'Enter a valid amount' });
      return;
    }
    setSaving(true);
    try {
      const result = await api.payments.create({
        schoolId: activeSchool.id,
        studentId: student.id,
        amount: numAmount,
        paymentMode: mode,
        referenceNumber: reference,
        feeBreakdown: [{ label: `Fee Payment (${mode})`, amount: numAmount }],
        paymentDate: date,
        cashierName: cashier,
        remarks,
      });
      setLastReceipt(result.payment);

      // Fire the particle burst from the confirm button's screen position.
      const rect = confirmBtnRef.current?.getBoundingClientRect();
      if (rect) fireParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 'emerald');

      pushToast({ tone: 'success', title: 'Payment recorded', message: `Receipt ${result.payment.receipt_number} generated.` });
      onSaved?.();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Payment failed', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function printNow() {
    if (!lastReceipt) return;
    await api.receipts.print({ schoolId: activeSchool.id, paymentId: lastReceipt.id });
  }

  async function savePdfNow() {
    if (!lastReceipt) return;
    const res = await api.receipts.savePdf({ schoolId: activeSchool.id, paymentId: lastReceipt.id });
    if (!res.canceled) pushToast({ tone: 'success', title: 'PDF saved', message: res.filePath });
  }

  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title="Record Fee Payment" subtitle={student.full_name} width="max-w-md">
      {!lastReceipt ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-panel !bg-white/[0.04] p-3.5 flex justify-between text-sm">
            <span className="text-slate-400">Pending Dues</span>
            <span className="text-neon-amber font-semibold">{formatINR(student.balance_pending)}</span>
          </div>

          <div>
            <label className="label-text">Payment Amount (₹) *</label>
            <input required type="number" min="0.01" step="0.01" autoFocus className="input-field text-lg font-semibold" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Payment Mode</label>
              <select className="input-field" value={mode} onChange={(e) => setMode(e.target.value)}>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Reference No.</label>
              <input className="input-field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={mode === 'Cash' ? 'Optional' : 'Cheque/UPI/TXN ref'} />
            </div>
            <div>
              <label className="label-text">Date</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label-text">Cashier Name</label>
              <input className="input-field" value={cashier} onChange={(e) => setCashier(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label-text">Remarks</label>
            <input className="input-field" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          <div className="glass-panel !bg-white/[0.04] p-3.5 flex justify-between text-sm">
            <span className="text-slate-400">Balance After This Payment</span>
            <span className={projectedBalance > 0 ? 'text-neon-crimson font-semibold' : 'text-neon-emerald font-semibold'}>
              {formatINR(projectedBalance)}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button ref={confirmBtnRef} type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Processing…' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-neon-emerald/15 border border-neon-emerald/50 shadow-glow flex items-center justify-center text-3xl text-neon-emerald">
            ✓
          </div>
          <div>
            <div className="text-white font-display font-semibold text-lg">Payment Recorded</div>
            <div className="text-sm text-slate-400 mt-1">Receipt {lastReceipt.receipt_number}</div>
          </div>
          <div className="flex justify-center gap-3">
            <button className="btn-secondary" onClick={printNow}>Print Receipt</button>
            <button className="btn-secondary" onClick={savePdfNow}>Save as PDF</button>
          </div>
          <button className="btn-primary w-full" onClick={onClose}>Done</button>
        </div>
      )}
    </Modal>
  );
}
