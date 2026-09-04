import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◈', end: true },
  { to: '/students', label: 'Students', icon: '◐' },
  { to: '/fee-structures', label: 'Fee Structures', icon: '◧' },
  { to: '/receipts', label: 'Receipts', icon: '▤' },
  { to: '/settings', label: 'Settings & Backup', icon: '◎' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-full glass-panel !rounded-none !border-y-0 !border-l-0 flex flex-col px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-neon-emerald to-cyan-500 shadow-glow flex items-center justify-center font-display font-bold text-ink-950">
          E
        </div>
        <div>
          <div className="font-display font-semibold text-white leading-tight">EduLedger</div>
          <div className="text-[10px] tracking-[0.2em] text-neon-emerald font-semibold">3D</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-white border border-white/10 shadow-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="text-base opacity-80">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2 text-[11px] text-slate-500 leading-relaxed">
        Offline-first · Data stored locally on this machine.
      </div>
    </aside>
  );
}
