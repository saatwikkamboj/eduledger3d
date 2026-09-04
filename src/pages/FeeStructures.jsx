import { useCallback, useEffect, useState } from 'react';
import TiltCard from '../components/TiltCard';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { CLASS_LIST, isSeniorSecondary } from '../utils/classList';
import { STREAMS } from '../utils/streams';
import { FEE_TYPES, FREQUENCIES, formatINR } from '../utils/formatCurrency';

function emptyForm(academicYear) {
  return { academicYear, className: '1st', stream: '', feeType: 'Tuition', label: 'Tuition Fee', amount: '', frequency: 'Monthly' };
}

export default function FeeStructures() {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const academicYear = useAppStore((s) => s.academicYear);
  const pushToast = useAppStore((s) => s.pushToast);
  const [rows, setRows] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(academicYear));
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    if (!activeSchool) return;
    const list = await api.feeStructures.list({ schoolId: activeSchool.id, academicYear, classFilter: classFilter || undefined });
    setRows(list);
  }, [activeSchool?.id, academicYear, classFilter]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm(academicYear));
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      academicYear: row.academic_year, className: row.class_name, stream: row.stream || '',
      feeType: row.fee_type, label: row.label, amount: row.amount, frequency: row.frequency,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { schoolId: activeSchool.id, ...form, amount: Number(form.amount) || 0, stream: isSeniorSecondary(form.className) ? form.stream : null };
    try {
      if (editing) await api.feeStructures.update({ ...payload, id: editing.id });
      else await api.feeStructures.create(payload);
      pushToast({ tone: 'success', title: editing ? 'Fee structure updated' : 'Fee structure added' });
      setModalOpen(false);
      load();
    } catch (err) {
      pushToast({ tone: 'error', title: 'Save failed', message: err.message });
    }
  }

  async function handleDelete() {
    await api.feeStructures.delete({ schoolId: activeSchool.id, id: deleteId });
    pushToast({ tone: 'info', title: 'Fee structure removed' });
    load();
  }

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Fee Structures</h1>
          <p className="text-sm text-slate-400 mt-1">{activeSchool?.name} · {academicYear}</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Fee Structure</button>
      </div>

      <TiltCard intensity={2} glare={false} className="p-4 flex gap-3">
        <select className="input-field !w-auto" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </TiltCard>

      <TiltCard intensity={2} glare={false} className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider border-b border-white/10 bg-white/5">
              <th className="py-3 px-4 font-medium">Class</th>
              <th className="py-3 px-4 font-medium">Stream</th>
              <th className="py-3 px-4 font-medium">Fee Type</th>
              <th className="py-3 px-4 font-medium">Label</th>
              <th className="py-3 px-4 font-medium">Frequency</th>
              <th className="py-3 px-4 font-medium text-right">Amount</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white">{r.class_name}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{r.stream || '-'}</td>
                <td className="py-3 px-4 text-slate-300">{r.fee_type}</td>
                <td className="py-3 px-4 text-slate-300">{r.label}</td>
                <td className="py-3 px-4 text-slate-400">{r.frequency}</td>
                <td className="py-3 px-4 text-right text-neon-emerald font-semibold">{formatINR(r.amount)}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button className="btn-ghost" onClick={() => openEdit(r)}>Edit</button>
                  <button className="btn-ghost text-neon-crimson" onClick={() => setDeleteId(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No fee structures defined yet.</td></tr>}
          </tbody>
        </table>
      </TiltCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Fee Structure' : 'Add Fee Structure'} width="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Class</label>
            <select className="input-field" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value, stream: '' })}>
              {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {isSeniorSecondary(form.className) && (
            <div>
              <label className="label-text">Stream (optional — leave blank to apply to all streams)</label>
              <select className="input-field" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })}>
                <option value="">All Streams</option>
                {STREAMS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Fee Type</label>
              <select className="input-field" value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value, label: `${e.target.value} Fee` })}>
                {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Frequency</label>
              <select className="input-field" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-text">Label</label>
            <input className="input-field" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Amount (₹)</label>
            <input required type="number" min="0" step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Fee Structure"
        message="This will remove the fee structure. Existing student ledgers are unaffected."
        danger
        confirmLabel="Delete"
      />
    </div>
  );
}
