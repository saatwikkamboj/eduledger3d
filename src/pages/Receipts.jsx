import { useCallback, useEffect, useState } from 'react';
import TiltCard from '../components/TiltCard';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { formatINR, formatDate } from '../utils/formatCurrency';

export default function Receipts() {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const pushToast = useAppStore((s) => s.pushToast);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = useCallback(async () => {
    if (!activeSchool) return;
    const list = await api.payments.listAll({ schoolId: activeSchool.id, search, fromDate: fromDate || undefined, toDate: toDate || undefined });
    setRows(list);
  }, [activeSchool?.id, search, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  async function printReceipt(paymentId) {
    await api.receipts.print({ schoolId: activeSchool.id, paymentId });
  }

  async function savePdf(paymentId) {
    const res = await api.receipts.savePdf({ schoolId: activeSchool.id, paymentId });
    if (!res.canceled) pushToast({ tone: 'success', title: 'PDF saved', message: res.filePath });
  }

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Receipts</h1>
          <p className="text-sm text-slate-400 mt-1">{rows.length} receipts · Total {formatINR(total)}</p>
        </div>
      </div>

      <TiltCard intensity={2} glare={false} className="p-4 flex flex-wrap gap-3 items-center">
        <input className="input-field flex-1 min-w-[220px]" placeholder="Search by student, receipt no, admission ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="date" className="input-field !w-auto" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <span className="text-slate-500 text-xs">to</span>
        <input type="date" className="input-field !w-auto" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </TiltCard>

      <TiltCard intensity={2} glare={false} className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider border-b border-white/10 bg-white/5">
              <th className="py-3 px-4 font-medium">Receipt No.</th>
              <th className="py-3 px-4 font-medium">Student</th>
              <th className="py-3 px-4 font-medium">Class</th>
              <th className="py-3 px-4 font-medium">Mode</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium text-right">Amount</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-slate-300">{p.receipt_number}</td>
                <td className="py-3 px-4">
                  <div className="text-white">{p.full_name}</div>
                  <div className="text-xs text-slate-500">{p.admission_id}</div>
                </td>
                <td className="py-3 px-4 text-slate-400">{p.class_name}{p.section ? `-${p.section}` : ''}</td>
                <td className="py-3 px-4 text-slate-400">{p.payment_mode}</td>
                <td className="py-3 px-4 text-slate-400">{formatDate(p.payment_date)}</td>
                <td className="py-3 px-4 text-right text-neon-emerald font-semibold">{formatINR(p.amount)}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button className="btn-ghost" onClick={() => printReceipt(p.id)}>Print</button>
                  <button className="btn-ghost" onClick={() => savePdf(p.id)}>PDF</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No receipts found.</td></tr>}
          </tbody>
        </table>
      </TiltCard>
    </div>
  );
}
