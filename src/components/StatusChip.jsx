const STYLE_MAP = {
  'Fully Paid': { cls: 'chip-paid', dot: 'bg-neon-emerald' },
  'Partially Paid': { cls: 'chip-partial', dot: 'bg-neon-amber' },
  Overdue: { cls: 'chip-overdue', dot: 'bg-neon-crimson' },
  Pending: { cls: 'chip-pending', dot: 'bg-slate-400' },
};

export default function StatusChip({ status, className = '' }) {
  const style = STYLE_MAP[status] || STYLE_MAP.Pending;
  return (
    <span className={`${style.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
