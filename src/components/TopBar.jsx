import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import SchoolSwitcherModal from './SchoolSwitcherModal';

export default function TopBar() {
  const activeSchool = useAppStore((s) => s.activeSchool());
  const academicYear = useAppStore((s) => s.academicYear);
  const setAcademicYear = useAppStore((s) => s.setAcademicYear);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <header className="h-16 shrink-0 flex items-center justify-between px-6 glass-panel !rounded-none !border-x-0 !border-t-0">
        <div className="flex items-center gap-3">
          {activeSchool?.logo_data_url ? (
            <img src={activeSchool.logo_data_url} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-neon-emerald/40 to-cyan-500/30 flex items-center justify-center font-display font-bold text-sm">
              {activeSchool?.name?.[0] || '?'}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-white leading-tight">{activeSchool?.name || 'No School Selected'}</div>
            <div className="text-[11px] text-slate-400">{activeSchool?.receipt_prefix}</div>
          </div>
          <button onClick={() => setSwitcherOpen(true)} className="btn-ghost ml-2 border border-white/10">
            Switch School
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="input-field !py-1.5 !w-auto text-xs"
          >
            {['2024-2025', '2025-2026', '2026-2027', '2027-2028'].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </header>

      <SchoolSwitcherModal open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
}
