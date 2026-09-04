import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TiltCard from '../components/TiltCard';
import StatusChip from '../components/StatusChip';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { formatINR, formatDate } from '../utils/formatCurrency';

const STAT_CARDS = [
  { key: 'netFee', label: 'Total Fee (Net)', accent: 'from-cyan-400/30 to-cyan-600/10', text: 'text-cyan-300' },
  { key: 'totalCollected', label: 'Collected', accent: 'from-neon-emerald/30 to-emerald-700/10', text: 'text-neon-emerald' },
  { key: 'totalPending', label: 'Pending', accent: 'from-neon-amber/30 to-amber-700/10', text: 'text-neon-amber' },
  { key: 'totalStudents', label: 'Students', accent: 'from-violet-400/30 to-violet-700/10', text: 'text-violet-300', isCount: true },
];

export default function Dashboard() {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const academicYear = useAppStore((s) => s.academicYear);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeSchool) return;
    (async () => {
      const [s, r] = await Promise.all([
        api.dashboard.stats({ schoolId: activeSchool.id, academicYear }),
        api.payments.recent({ schoolId: activeSchool.id, limit: 8 }),
      ]);
      setStats(s);
      setRecent(r);
    })();
  }, [activeSchool?.id, academicYear]);

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">{activeSchool?.name} · Academic Year {academicYear}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map((c) => (
          <TiltCard key={c.key} intensity={10} className={`p-5 bg-gradient-to-br ${c.accent}`}>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">{c.label}</div>
            <div className={`text-2xl font-display font-bold ${c.text}`}>
              {stats ? (c.isCount ? stats[c.key] : formatINR(stats[c.key])) : '—'}
            </div>
          </TiltCard>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <TiltCard intensity={5} className="p-5 text-center">
          <StatusChip status="Fully Paid" />
          <div className="text-2xl font-display font-bold text-white mt-3">{stats?.fullyPaid ?? '—'}</div>
        </TiltCard>
        <TiltCard intensity={5} className="p-5 text-center">
          <StatusChip status="Partially Paid" />
          <div className="text-2xl font-display font-bold text-white mt-3">{stats?.partiallyPaid ?? '—'}</div>
        </TiltCard>
        <TiltCard intensity={5} className="p-5 text-center">
          <StatusChip status="Overdue" />
          <div className="text-2xl font-display font-bold text-white mt-3">{stats?.overdue ?? '—'}</div>
        </TiltCard>
        <TiltCard intensity={5} className="p-5 text-center">
          <StatusChip status="Pending" />
          <div className="text-2xl font-display font-bold text-white mt-3">{stats?.pending ?? '—'}</div>
        </TiltCard>
      </div>

      <TiltCard intensity={3} glare={false} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white">Recent Payments</h2>
          <button className="btn-ghost" onClick={() => navigate('/receipts')}>View All Receipts →</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider border-b border-white/10">
              <th className="pb-2 font-medium">Receipt No.</th>
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Class</th>
              <th className="pb-2 font-medium">Mode</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2.5 font-mono text-xs text-slate-300">{p.receipt_number}</td>
                <td className="py-2.5 text-white">{p.full_name}</td>
                <td className="py-2.5 text-slate-400">{p.class_name}{p.section ? `-${p.section}` : ''}</td>
                <td className="py-2.5 text-slate-400">{p.payment_mode}</td>
                <td className="py-2.5 text-slate-400">{formatDate(p.payment_date)}</td>
                <td className="py-2.5 text-right text-neon-emerald font-semibold">{formatINR(p.amount)}</td>
              </tr>
            ))}
            {!recent.length && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">No payments recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </TiltCard>
    </div>
  );
}
