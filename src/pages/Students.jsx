import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TiltCard from '../components/TiltCard';
import StatusChip from '../components/StatusChip';
import AddEditStudentModal from '../features/AddEditStudentModal';
import api from '../api/client';
import { useAppStore } from '../store/appStore';
import { CLASS_LIST } from '../utils/classList';
import { STREAMS } from '../utils/streams';
import { formatINR } from '../utils/formatCurrency';

const STATUSES = ['Fully Paid', 'Partially Paid', 'Overdue', 'Pending'];

export default function Students() {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const academicYear = useAppStore((s) => s.academicYear);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!activeSchool) return;
    const rows = await api.students.list({
      schoolId: activeSchool.id, academicYear, search,
      classFilter: classFilter || undefined,
      streamFilter: streamFilter || undefined,
      statusFilter: statusFilter || undefined,
    });
    setStudents(rows);
  }, [activeSchool?.id, academicYear, search, classFilter, streamFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditingStudent(null);
    setModalOpen(true);
  }

  function openEdit(student, e) {
    e.stopPropagation();
    setEditingStudent(student);
    setModalOpen(true);
  }

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Students</h1>
          <p className="text-sm text-slate-400 mt-1">{students.length} students · {activeSchool?.name}</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Student</button>
      </div>

      <TiltCard intensity={2} glare={false} className="p-4 flex flex-wrap gap-3 items-center">
        <input
          className="input-field flex-1 min-w-[220px]"
          placeholder="Search by name, admission ID, father's name, contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input-field !w-auto" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setStreamFilter(''); }}>
          <option value="">All Classes</option>
          {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(classFilter === '11th' || classFilter === '12th') && (
          <select className="input-field !w-auto" value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)}>
            <option value="">All Streams</option>
            {STREAMS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
        <select className="input-field !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </TiltCard>

      <TiltCard intensity={2} glare={false} className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider border-b border-white/10 bg-white/5">
              <th className="py-3 px-4 font-medium">Student</th>
              <th className="py-3 px-4 font-medium">Class / Section</th>
              <th className="py-3 px-4 font-medium">Stream</th>
              <th className="py-3 px-4 font-medium text-right">Total Fee</th>
              <th className="py-3 px-4 font-medium text-right">Paid</th>
              <th className="py-3 px-4 font-medium text-right">Balance</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr
                key={st.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/students/${st.id}`)}
              >
                <td className="py-3 px-4">
                  <div className="text-white font-medium">{st.full_name}</div>
                  <div className="text-xs text-slate-500">{st.admission_id}</div>
                </td>
                <td className="py-3 px-4 text-slate-300">{st.class_name}{st.section ? `-${st.section}` : ''}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{st.stream || '-'}</td>
                <td className="py-3 px-4 text-right text-slate-300">{formatINR(st.net_fee)}</td>
                <td className="py-3 px-4 text-right text-neon-emerald">{formatINR(st.total_paid)}</td>
                <td className="py-3 px-4 text-right text-neon-amber">{formatINR(st.balance_pending)}</td>
                <td className="py-3 px-4"><StatusChip status={st.status} /></td>
                <td className="py-3 px-4 text-right">
                  <button className="btn-ghost" onClick={(e) => openEdit(st, e)}>Edit</button>
                </td>
              </tr>
            ))}
            {!students.length && (
              <tr><td colSpan={8} className="py-10 text-center text-slate-500">No students match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </TiltCard>

      <AddEditStudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        student={editingStudent}
        onSaved={load}
      />
    </div>
  );
}
