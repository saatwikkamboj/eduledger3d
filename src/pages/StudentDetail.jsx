import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TiltCard from '../components/TiltCard';
import StatusChip from '../components/StatusChip';
import ConfirmDialog from '../components/ConfirmDialog';
import FeeEntryModal from '../features/FeeEntryModal';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { formatINR, formatDate } from '../utils/formatCurrency';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activeSchool = useAppStore((s) => s.activeSchool());
  const pushToast = useAppStore((s) => s.pushToast);
  const [student, setStudent] = useState(null);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!activeSchool) return;
    const s = await api.students.get({ schoolId: activeSchool.id, id: Number(id) });
    setStudent(s);
  }, [activeSchool?.id, id]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    await api.students.delete({ schoolId: activeSchool.id, id: Number(id) });
    pushToast({ tone: 'info', title: 'Student removed' });
    navigate('/students');
  }

  async function printReceipt(paymentId) {
    await api.receipts.print({ schoolId: activeSchool.id, paymentId });
  }

  async function savePdf(paymentId) {
    const res = await api.receipts.savePdf({ schoolId: activeSchool.id, paymentId });
    if (!res.canceled) pushToast({ tone: 'success', title: 'PDF saved', message: res.filePath });
  }

  if (!student) return <div className="text-slate-500 p-8">Loading…</div>;

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigate('/students')}>← Back</button>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">{student.full_name}</h1>
            <p className="text-sm text-slate-400">{student.admission_id} · {student.class_name}{student.section ? `-${student.section}` : ''}{student.stream ? ` · ${student.stream}` : ''}</p>
          </div>
          <StatusChip status={student.status} />
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary text-neon-crimson" onClick={() => setDeleteOpen(true)}>Remove</button>
          <button className="btn-primary" onClick={() => setFeeModalOpen(true)}>+ Record Payment</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <TiltCard intensity={8} className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Total Fee</div>
          <div className="text-xl font-display font-bold text-white">{formatINR(student.total_fee)}</div>
        </TiltCard>
        <TiltCard intensity={8} className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Concession</div>
          <div className="text-xl font-display font-bold text-cyan-300">{formatINR(student.concession)}</div>
        </TiltCard>
        <TiltCard intensity={8} className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Total Paid</div>
          <div className="text-xl font-display font-bold text-neon-emerald">{formatINR(student.total_paid)}</div>
        </TiltCard>
        <TiltCard intensity={8} className="p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Balance Pending</div>
          <div className="text-xl font-display font-bold text-neon-amber">{formatINR(student.balance_pending)}</div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <TiltCard intensity={3} glare={false} className="p-5">
          <h2 className="font-display font-semibold text-white mb-4">Student Information</h2>
          <dl className="space-y-2.5 text-sm">
            {[
              ['Father\'s Name', student.father_name],
              ['Mother\'s Name', student.mother_name],
              ['Contact', student.contact_number],
              ['Address', student.address],
              ['Due Date', formatDate(student.due_date)],
              ['Academic Year', student.academic_year],
              student.subjects?.length ? ['Subjects', student.subjects.join(', ')] : null,
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-white text-right max-w-[60%]">{v || '-'}</dd>
              </div>
            ))}
          </dl>
        </TiltCard>

        <TiltCard intensity={3} glare={false} className="p-5">
          <h2 className="font-display font-semibold text-white mb-4">Payment History</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {student.payments?.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3.5 py-3">
                <div>
                  <div className="text-sm font-medium text-white font-mono">{p.receipt_number}</div>
                  <div className="text-xs text-slate-400">{formatDate(p.payment_date)} · {p.payment_mode}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-neon-emerald font-semibold">{formatINR(p.amount)}</div>
                  <button className="btn-ghost" onClick={() => printReceipt(p.id)}>Print</button>
                  <button className="btn-ghost" onClick={() => savePdf(p.id)}>PDF</button>
                </div>
              </div>
            ))}
            {!student.payments?.length && <div className="text-slate-500 text-sm py-6 text-center">No payments recorded yet.</div>}
          </div>
        </TiltCard>
      </div>

      <FeeEntryModal
        open={feeModalOpen}
        onClose={() => setFeeModalOpen(false)}
        student={student}
        onSaved={load}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Remove Student"
        message={`Are you sure you want to remove ${student.full_name}? This can't be undone.`}
        danger
        confirmLabel="Remove"
      />
    </div>
  );
}
